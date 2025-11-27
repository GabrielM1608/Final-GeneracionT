document.addEventListener('DOMContentLoaded', () => {

    const API_BASE = "https://villanueva-final.gabrielmendez24734.workers.dev";

    const usuarioGuardado = sessionStorage.getItem('usuario');
    const esPaginaLogin = window.location.pathname.endsWith('ingreso.html');
    const esPaginaInformes = window.location.pathname.endsWith('informes.html');

    if (esPaginaInformes && !usuarioGuardado) {
        window.location.href = 'ingreso.html';
    } else if (esPaginaLogin && usuarioGuardado) {
        window.location.href = 'informes.html';
    }

    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const usuarioInput = document.getElementById('usuario').value.trim();
            const contrasenaInput = document.getElementById('contrasena').value.trim();
            const mensajeError = document.getElementById('mensaje-error');
            const usuarioValido = "admin";
            const contrasenaValida = "1234";

            if (usuarioInput === usuarioValido && contrasenaInput === contrasenaValida) {
                sessionStorage.setItem('usuario', usuarioInput);
                window.location.href = 'informes.html';
            } else {
                if (mensajeError) {
                    mensajeError.textContent = "Usuario o contraseña incorrectos";
                    mensajeError.style.color = "red";
                } else {
                    alert("Usuario o contraseña incorrectos");
                }
            }
        });
    }

    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;

    function showSlide(index) {
        if (slides.length === 0) return;
        if (index >= totalSlides) currentSlide = 0;
        if (index < 0) currentSlide = totalSlides - 1;
        slides.forEach(slide => slide.classList.remove('active'));
        slides[currentSlide].classList.add('active');
    }

    function moveSlide(direction) {
        currentSlide += direction;
        showSlide(currentSlide);
    }

    window.moveSlide = moveSlide;

    function autoplay() {
        moveSlide(1);
    }

    if (document.getElementById('slider')) {
        showSlide(currentSlide);
        let autoplayInterval = setInterval(autoplay, 3000);
        const sliderContainer = document.querySelector('.slider-container');
        if (sliderContainer) {
            sliderContainer.addEventListener('mouseover', () => clearInterval(autoplayInterval));
            sliderContainer.addEventListener('mouseout', () => autoplayInterval = setInterval(autoplay, 3000));
        }
    }

    const FORM_INFORME = document.getElementById('form-informe');
    const LISTA_INFORMES = document.getElementById('lista-informes');

    function procesarTexto(texto) {
        return texto.replace(/(https?:\/\/[^\s]+)/g, function(url) {
            return `<a href="${url}" target="_blank">${url}</a>`;
        });
    }

    async function cargarInformes() {
        if (!LISTA_INFORMES) return;
        try {
            const response = await fetch(`${API_BASE}/informes`);
            const informesData = await response.json();
            LISTA_INFORMES.innerHTML = '';
            if (!informesData || informesData.length === 0) {
                LISTA_INFORMES.innerHTML = '<p id="mensaje-vacio">No hay informes publicados aún.</p>';
                return;
            }
            informesData.forEach(informe => {
                const informeDiv = document.createElement('article');
                informeDiv.classList.add('informe');
                const fechaPublicacion = new Date(informe.timestamp).toLocaleString('es-AR', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                informeDiv.innerHTML = `
                    <h3>${informe.titulo}</h3>
                    <p class="fecha-publicacion">Publicado el: ${fechaPublicacion}</p>
                    <p>${procesarTexto(informe.contenido).replace(/\n/g, '<br>')}</p>
                `;
                LISTA_INFORMES.appendChild(informeDiv);
            });
        } catch (error) {
            console.error("Error cargando informes:", error);
            LISTA_INFORMES.innerHTML = "<p>Error al cargar los informes.</p>";
        }
    }

    cargarInformes();

    let quill = null;
    if (document.getElementById('editor-container')) {
        quill = new Quill('#editor-container', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    [{ 'align': [] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['link', 'image'],
                    ['blockquote', 'code-block'],
                    [{ 'script': 'sub' }, { 'script': 'super' }],
                    [{ 'indent': '-1' }, { 'indent': '+1' }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['clean']
                ]
            }
        });
    }

    if (FORM_INFORME) {
        FORM_INFORME.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titulo = document.getElementById('titulo').value;
            const contenido = quill ? quill.root.innerHTML : '';
            try {
                await fetch(`${API_BASE}/informes`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ titulo, contenido, timestamp: new Date().toISOString() })
                });
                FORM_INFORME.reset();
                cargarInformes();
            } catch (error) {
                console.error("Error enviando informe:", error);
                alert("Error al guardar informe");
            }
        });
    }

    // ---------- TURNOS ----------
    const formTurno = document.getElementById('form-turno');
    const fechaInput = document.getElementById('fecha');
    const horaSelect = document.getElementById('hora');
    const mensajeTurno = document.getElementById('mensaje-turno');

    function generarHorarios() {
        if (!horaSelect) return;
        horaSelect.innerHTML = '<option value="">Elegí una hora</option>';
        let horaInicio = 9;
        let minuto = 0;
        while (horaInicio < 17 || (horaInicio === 17 && minuto === 0)) {
            let h = horaInicio.toString().padStart(2, '0');
            let m = minuto.toString().padStart(2, '0');
            let valor = `${h}:${m}`;
            let opcion = document.createElement('option');
            opcion.value = valor;
            opcion.textContent = valor;
            horaSelect.appendChild(opcion);
            minuto += 30;
            if (minuto === 60) { minuto = 0; horaInicio++; }
        }
    }

    if (fechaInput) fechaInput.addEventListener('change', generarHorarios);
    generarHorarios();

    if (formTurno) {
        formTurno.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('nombre-turno').value.trim();
            const fecha = fechaInput.value;
            const hora = horaSelect.value;

            if (!nombre || !fecha || !hora) {
                mensajeTurno.textContent = "Complete todos los campos";
                mensajeTurno.style.color = "red";
                return;
            }

            try {
                await fetch(`${API_BASE}/turnos`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nombre, fecha, hora, timestamp: new Date().toISOString() })
                });

                mensajeTurno.textContent = `Turno reservado para ${nombre} el ${fecha} a las ${hora}`;
                mensajeTurno.style.color = "green";
                formTurno.reset();
                generarHorarios();
            } catch (error) {
                console.error("Error al guardar turno:", error);
                mensajeTurno.textContent = "Error al guardar el turno.";
                mensajeTurno.style.color = "red";
            }
        });
    }

    // ---------- FORMULARIO DE CONTACTO ----------
    const formContacto = document.getElementById('form-contacto-general');
    const respuestaGeneral = document.getElementById('respuesta-general');

    if (formContacto) {
        formContacto.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('nombre-general').value.trim();
            const email = document.getElementById('email-general').value.trim();
            const mensaje = document.getElementById('mensaje-texto').value.trim();

            if (!nombre || !email || !mensaje) {
                respuestaGeneral.textContent = "Complete todos los campos";
                respuestaGeneral.style.color = "red";
                return;
            }

            try {
                // Llamada al Worker que usa Mailjet
                const res = await fetch(`${API_BASE}/contacto`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, email, mensaje })
                });

                const data = await res.json();
                respuestaGeneral.textContent = data.message;
                respuestaGeneral.style.color = data.success ? "green" : "red";

                if (data.success) formContacto.reset();
            } catch (err) {
                console.error(err);
                respuestaGeneral.textContent = "Error al enviar el mensaje";
                respuestaGeneral.style.color = "red";
            }
        });
    }

});
