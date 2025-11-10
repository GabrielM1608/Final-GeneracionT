import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {
    const firebaseConfig = {
        apiKey: "AIzaSyB5jwR4dGtLUfxe-CWR8qzl-_L4fUHKrJY",
        authDomain: "informes-81a21.firebaseapp.com",
        projectId: "informes-81a21",
        storageBucket: "informes-81a21.firebasestorage.app",
        messagingSenderId: "511446475359",
        appId: "1:511446475359:web:020bf09611c488d1c231ea",
        measurementId: "G-MK5YJL6MMW",
        databaseURL: "https://informes-81a21-default-rtdb.firebaseio.com/"
    };

    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);

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
        document.querySelector('.slider-container').addEventListener('mouseover', () => clearInterval(autoplayInterval));
        document.querySelector('.slider-container').addEventListener('mouseout', () => autoplayInterval = setInterval(autoplay, 3000));
    }

    const FORM_INFORME = document.getElementById('form-informe');
    const LISTA_INFORMES = document.getElementById('lista-informes');

    function procesarTexto(texto) {
        texto = texto.replace(/(https?:\/\/[^\s]+)/g, function(url) {
            return `<a href="${url}" target="_blank">${url}</a>`;
        });
        return texto;
    }

    function cargarInformes() {
        if (!LISTA_INFORMES) return;
        const dbRef = ref(db, 'informes/');
        onValue(dbRef, (snapshot) => {
            const informesData = snapshot.val();
            LISTA_INFORMES.innerHTML = '';
            if (!informesData) {
                LISTA_INFORMES.innerHTML = '<p id="mensaje-vacio">No hay informes publicados aún.</p>';
                return;
            }
            Object.values(informesData).forEach(informe => {
                const informeDiv = document.createElement('article');
                informeDiv.classList.add('informe');
                const fechaPublicacion = new Date(informe.timestamp).toLocaleString('es-AR', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
                informeDiv.innerHTML = `
                    <h3>${informe.titulo}</h3>
                    <p class="fecha-publicacion">Publicado el: ${fechaPublicacion}</p>
                    <p>${procesarTexto(informe.contenido).replace(/\n/g, '<br>')}</p>
                `;
                LISTA_INFORMES.appendChild(informeDiv);
            });
        });
    }

    cargarInformes();

    const quill = new Quill('#editor-container', {
        theme: 'snow', 
        modules: {
            toolbar: [
                [{ 'header': '1'}, { 'header': '2'}, { 'font': [] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'align': [] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['link', 'image'],
                ['blockquote', 'code-block'],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['clean']                                         
            ]
        }
    });

    if (FORM_INFORME) {
        FORM_INFORME.addEventListener('submit', (e) => {
            e.preventDefault();
            const titulo = document.getElementById('titulo').value;
            const contenido = quill.root.innerHTML;
            const dbRef = ref(db, 'informes/');
            push(dbRef, {
                titulo,
                contenido,
                timestamp: new Date().toISOString()
            });
            FORM_INFORME.reset();
        });
    }
});
