export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    const pathname = url.pathname.replace(/\/$/, "");
    console.log("PATH recibida:", pathname);

    if (pathname === "") {
      return new Response("WORKER FUNCIONANDO ✅");
    }


    if (pathname === "/contacto" && request.method === "POST") {
      const data = await request.json();
      const { nombre, email, mensaje } = data;

      if (!nombre || !email || !mensaje) {
        return new Response(JSON.stringify({ success: false, message: "Complete todos los campos" }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      try {
        await env.informes_db
          .prepare("INSERT INTO mensajes (nombre, email, mensaje, timestamp) VALUES (?, ?, ?, ?)")
          .bind(nombre, email, mensaje, new Date().toISOString())
          .run();
      } catch (err) {
        console.error("Error guardando mensaje en DB:", err);
        return new Response(JSON.stringify({ success: false, message: "Error guardando mensaje en DB" }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      try {
        const MAILJET_API_KEY = env.MAILJET_API_KEY;
        const MAILJET_SECRET_KEY = env.MAILJET_SECRET_KEY;
        const TO_EMAIL = env.TO_EMAIL;

        const correo = {
          Messages: [
            {
              From: { Email: "no-reply@tudominio.com", Name: "Contacto Web" },
              To: [{ Email: TO_EMAIL, Name: "Recipiente" }],
              Subject: `Consulta de ${nombre}`,
              TextPart: `Nombre: ${nombre}\nEmail: ${email}\nMensaje: ${mensaje}`
            }
          ]
        };

        const respuesta = await fetch("https://api.mailjet.com/v3.1/send", {
          method: "POST",
          headers: {
            "Authorization": "Basic " + btoa(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`),
            "Content-Type": "application/json"
          },
          body: JSON.stringify(correo)
        });

        if (!respuesta.ok) {
          const text = await respuesta.text();
          console.error("Error enviando correo:", text);
          return new Response(JSON.stringify({ success: false, message: "Mensaje guardado, pero error enviando correo" }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        return new Response(JSON.stringify({ success: true, message: "Mensaje enviado y guardado ✅" }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });

      } catch (err) {
        console.error("Error enviando correo:", err);
        return new Response(JSON.stringify({ success: false, message: "Mensaje guardado, pero error enviando correo" }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    if (pathname === "/informes" && request.method === "GET") {
      const { results } = await env.informes_db.prepare("SELECT * FROM informes ORDER BY id DESC").all();
      return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    if (pathname === "/informes" && request.method === "POST") {
      const data = await request.json();
      await env.informes_db
        .prepare("INSERT INTO informes (titulo, contenido, timestamp) VALUES (?, ?, ?)")
        .bind(data.titulo, data.contenido, data.timestamp)
        .run();
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    if (pathname === "/turnos" && request.method === "POST") {
      const data = await request.json();
      await env.informes_db
        .prepare("INSERT INTO turnos (nombre, fecha, hora, timestamp) VALUES (?, ?, ?, ?)")
        .bind(data.nombre, data.fecha, data.hora, data.timestamp)
        .run();
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    return new Response("Ruta no encontrada", { status: 404 });
  }
};
