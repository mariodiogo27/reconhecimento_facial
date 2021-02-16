// The buttons to start & stop stream and to capture the image
var btnStart = document.getElementById("btn-start");
var btnRegister = document.getElementById("btn-register");

// The stream & capture
var stream = document.getElementById("stream");
var capture = document.getElementById("capture");
var snapshot = document.getElementById("snapshot");

// The video stream
var cameraStream = null;

function promisify(xhr, failNon2xx = true) {
    const oldSend = xhr.send;
    xhr.send = function () {
        const xhrArguments = arguments;
        return new Promise(function (resolve, reject) {
            xhr.onload = function () {
                if (failNon2xx && (xhr.status < 200 || xhr.status >= 300)) {
                    reject({ request: xhr });
                } else {
                    resolve(xhr);
                }
            };
            xhr.onerror = function () {
                reject({ request: xhr });
            };
            oldSend.apply(xhr, xhrArguments);
        });
    }
}


function animate(response) {
    
    $("#tracking, #report, #analysis").empty()
    setTimeout(function () {
        $('.view').removeClass('filter-red_blur');
    }, 500);

    var analysis = "^1000<h2>Analisando:</h2>";
    
    var tracking = response._label === 'unknown'? `^1500Identidade desconhecida<span class='square'>&#9632;</span>`
                    :`^1500Bem-Vindo ${response._label} <span class='square'>&#9632;</span>`;

    $(function () {
        var typed = new Typed("#report", {
            strings: [`^1000<p><p>Scan Terminado<br/><br/></p>
        ^500<p>Genero ${response.gender}<br/>Probabilidade de género ${response.genderProbability.toFixed(2)}<br/>Idade ${response.age.toFixed(2)}<br/><br/></p>
            ^500<p>expressão Facial ${response.expression.expression}</p>
            <p>Probabilidade ${response.expression.probability.toFixed(2)}</p>`],
            showCursor: false,
            loop: false
        });
        var typed = new Typed("#analysis", {
            strings: [analysis],
            loop: false,
            showCursor: false,
            typeSpeed: 0,
            onComplete: function () {
                var typed = new Typed("#tracking", {
                    strings: [tracking],
                    loop: false,
                    showCursor: false,
                    typeSpeed: 0
                });
            }
        });

    });
}


function startStreamingRegister() {

    var mediaSupport = 'mediaDevices' in navigator;

    if (mediaSupport && null == cameraStream) {

        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (mediaStream) {

                cameraStream = mediaStream;

                stream.srcObject = mediaStream;

                stream.play();
                setTimeout(() => {

                    captureSnapshotsRegister();
                }, 1000);
            })
            .catch(function (err) {

                console.log("Não Foi Possivel Acessar a Camera: " + err);
            });
    }
    else {

        alert('Seu Navegador Não suporta dispositivos de Mídia.');

        return;
    }
}


async function captureSnapshotsRegister() {

    if (null != cameraStream) {

        const directions = ["na Camera", "um pouco para a esquerda"];
        var data = new FormData();
        const label = document.getElementById("name").value.trim()
        if (label.length === 0) {
            stopStreaming();
            return alert("Digite o Seu Nome");
        }
        data.append("label", label);

        for (i = 0; i < 2; i++) {
            alert(`Por Favor olhe ${directions[i]}`)
            var ctx = capture.getContext('2d');
            var img = new Image();

            ctx.drawImage(stream, 0, 0, capture.width, capture.height);

            img.src = capture.toDataURL("image/jpeg");
            img.width = 240;

            const res = await fetch(img.src)
            const blob = await res.blob()

            const file = new File([blob], `${i + 1}.jpg`, blob)

            data.append("image", file);
        }

        var xhr = new XMLHttpRequest();
        promisify(xhr);

        xhr.open("POST", "http://localhost:5000/register");
        xhr.send(data).then(res => {
            stopStreaming();
            document.getElementById("name").value = '';
        });






    }
}



// Start Streaming
function startStreaming() {
    var mediaSupport = 'mediaDevices' in navigator;

    if (mediaSupport && null == cameraStream) {

        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (mediaStream) {

                cameraStream = mediaStream;

                stream.srcObject = mediaStream;

                stream.play();
                setTimeout(() => {

                    captureSnapshot();
                }, 1000);
            })
            .catch(function (err) {

                console.log("Não Foi possível acessar a camera: " + err);
            });
    }
    else {

        alert('Seu Navegador Não suporta dispositivos de Mídia.');

        return;
    }
}

// Stop Streaming
function stopStreaming() {
    if (null != cameraStream) {
        var track = cameraStream.getTracks()[0];
        track.stop();
        stream.load();
        cameraStream = null;
    }
}

function captureSnapshot() {

    if (null != cameraStream) {

        var ctx = capture.getContext('2d');
        var img = new Image();

        ctx.drawImage(stream, 0, 0, capture.width, capture.height);

        img.src = capture.toDataURL("image/jpeg");
        img.width = 240;

        fetch(img.src)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], 'dot.jpg', blob)
                var data = new FormData();
                data.append("image", file);

                var xhr = new XMLHttpRequest();
                promisify(xhr);

                xhr.open("POST", "http://localhost:5000/");
                xhr.send(data).then(res => {
                    const result = JSON.parse(res.response)
                    const expression = Object.keys(result.expressions).sort(function (a, b) { return result.expressions[b] - result.expressions[a] })[0]
                    result.expression = { expression, probability: result.expressions[expression] }
                    console.log(result.expression)
                    animate(result);
                });
            })

    }
}