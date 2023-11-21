const {createDetector,SupportedModels} = require('@tensorflow-models/face-detection');
const Detector = require("./detector");
const tf = require('@tensorflow/tfjs')
tf.setBackend('webgl')
const Camera = require('./face-camera');
const camera = new Camera();

const faceLookupIndices = [
    'rightEye', 'leftEye', 'noseTip', 'mouthCenter', 'rightEarTragion',
    'leftEarTragion'
  ];

class FaceDetector extends Detector {
    constructor () {
        super();
    }

    static _createDetector() {
        const model = SupportedModels.MediaPipeFaceDetector;
        const detector = createDetector(model, {
            runtime: 'tfjs',
            detectorModelType: 'short',
            maxFaces: 5,
            detectorModelUrl: './tensorflow-models/face_detection_short/model.json'
        })
        console.log('model loading success!, detector: ', detector)
        return detector;
    }

    static _captureImageData(video) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;  // Set video width and height = canvas width and height -> to make the video screen will appear
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);  // 웹캠에서 받아온 비디오 프레임이 실시간으로 캔버스에 표시
        return ctx.getImageData(0, 0, canvas.width, canvas.height);

    }
    
    async detect() {
        // Detect the hand from the webcam
        const video = document.getElementById('video');
        const imageData = this._captureImageData(video);
        console.log('imageData:', imageData);

        const detector = await this._createDetector();
        const faces = detector.estimateFaces(imageData, { flipHorizontal: false });
        console.log(faces);
    }
}

async function app() {
    try {
        const camera = await Camera.setupCamera();
        camera.drawCtx();

        console.log(tf.getBackend());
        // const video = document.getElementById('video');
        // const imageData = FaceDetector._captureImageData(video);
        // console.log('imageData:', imageData);

        const detector = await FaceDetector._createDetector();
        const faces = await detector.estimateFaces(camera.video, { flipHorizontal: false });
        console.log(faces);

        // console.log(tf.getBackend());
    } catch (error) {
        console.error('Error setting up the camera:', error);
    }
}; //app()

app();

module.exports = FaceDetector;