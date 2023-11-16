/**
 * 모델 로드 성공
 *  - npm + require -> createDetector 함수에서 detectorModelUrl에 모델이 위치한 상대 경로 적어줌
 *  - 이 코드 기반으로 로컬 로직에서도 모델 로드, 키포인트 출력까지 성공 
 *  - draw_locallogic에서 비디오에 키포인트 그리는 것 구현할 계획
 */

// import Libraries
const Detector = require('./detector');
const Camera = require('./handpose-camera');
const camera = new Camera();

require('@mediapipe/hands')
const tf = require('@tensorflow/tfjs')
tf.setBackend('webgl')
require('@tensorflow/tfjs-converter')
require('@tensorflow/tfjs-core')
const { createDetector, SupportedModels }  = require('@tensorflow-models/hand-pose-detection')


// 변수 설정 
let detector;
let animationFrameId;  // 버튼 클릭하면 좌표 예측 멈추도록 변수 설정
let rafId;


class HandposeDetector extends Detector {
    constructor () {
        super();
    }

    // 손 감지기(detector)를 생성하는 함수: 생성된 감지기는 설정된 옵션에 따라 손의 위치를 추정
    // handPoseDetection 패키지를 사용하여 MediaPipeHands 모델을 기반으로 감지기를 생성
    static async _createDetector() {        
        const hands = SupportedModels.MediaPipeHands;
        console.log('hands: ', hands);
        const detector =  createDetector(hands, {
        runtime: 'tfjs',
        modelType: 'lite', //or lite
        maxHands: 2, // or 2~10.
        detectorModelUrl: './tensorflow-models/tfjs-model_handpose_3d_detector_lite_1/model.json',
        landmarkModelUrl: './tensorflow-models/tfjs-model_handpose_3d_landmark_lite_1/model.json'
        })
        console.log('detector: ', detector);
        return detector;
    }
    
    // 비디오 프레임에서 손을 감지하고 결과를 시각화하는 함수
    static async renderResult() {
    if (camera.video.readyState < 2) {
        // 비디오의 로드가 완료될 때까지 대기
        await new Promise((resolve) => {
            camera.video.onloadeddata = () => {
            resolve(video);
        };
        });
    }

    let hands = null;

    if (detector != null) {

        try {
        // 생성된 감지기를 사용하여 비디오 프레임에서 손을 추정
        hands = await detector.estimateHands(
            camera.video,
            { flipHorizontal: false });
        } catch (error) {
        detector.dispose();
        detector = null;
        alert(error);
        }
    }

    camera.drawCtx();
    // 손이 감지되면 drawResults() 함수를 사용하여 손의 위치를 시각화
    if (hands && hands.length > 0) {
        camera.drawResults(hands);
    }
    }
    
    // renderResult() 함수를 호출하여 손의 위치를 시각화
    static async renderPrediction() {
    await HandposeDetector.renderResult();

    // requestAnimationFrame() : 지속적으로 프레임을 렌더링
    rafId = requestAnimationFrame(HandposeDetector.renderPrediction);
    };

    // Key Functions : Detect the hand from the webcam | Estimate the position of the hand
    enable () {
        super.enable(); 
        this._canvas = document.createElement('canvas');
        this._canvas.width = Detector.DIMENSIONS[0];
        this._canvas.height = Detector.DIMENSIONS[1];
        this._context = this._canvas.getContext('2d');
    }; //enable

    disable () {
        super.disable();
        delete this._context;
        delete this._canvas;
        this._context = null;
        this._canvas = null;

        delete this._tracker;
        this._tracker = null;
    } //disable

    static captureImageData(video) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;  // Set video width and height = canvas width and height -> to make the video screen will appear
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);  // 웹캠에서 받아온 비디오 프레임이 실시간으로 캔버스에 표시
        return ctx.getImageData(0, 0, canvas.width, canvas.height);

    }

    detect(imageData) {
        function detectFrame() {

            // Detect the hand from the webcam
            const video = document.getElementById('video');
            const imageData = HandposeDetector.captureImageData(video);
            console.log('imageData2:', imageData);

            return new Promise((resolve, reject) => {
                detector.estimateHands(imageData)
                    .then((predictions) => {
                        console.log(predictions.length);
                        console.log('Predictions saved successfully!');
        
                        if (predictions.length > 0) {
                            console.log(`Predictions: `, predictions);
                            for (let i = 0; i < predictions.length; i++) {
                                const handedness = predictions[i].handedness;
                                const keypoints = predictions[i].keypoints;
        
                                if (handedness === 'Left') {
                                    console.log('Left hand keypoints:');
                                } else if (handedness === 'Right') {
                                    console.log('Right hand keypoints:');
                                }
        
                                for (let j = 0; j < keypoints.length; j++) {
                                    let x = keypoints[j].x;
                                    let y = keypoints[j].y;
        
                                    // Reset the axis to match the Rogic axis
                                    if (x >= 320 && y >= 240) {  // The first quadrant
                                        x = Math.abs(x - 320);
                                        y = Math.abs(y - 240);
                                    } else if (x < 320 && y >= 240) { // The second quadrant
                                        x = -Math.abs(x - 320);
                                        y = Math.abs(y - 240);
                                    } else if (x < 320 && y < 240) { // The third quadrant
                                        x = -Math.abs(x - 320);
                                        y = -Math.abs(y - 240);
                                    } else { // The fourth quadrant
                                        x = Math.abs(x - 320);
                                        y = -Math.abs(y - 240);
                                    }
        
                                    console.log(`Keypoint ${j}: [${x}, ${y}]`);
                                } //for - keypoints.length
                            }  //for - prediction.length
                        } //if - predictions.length

                        resolve(); // Resolve the Promise when done
                    })
                    .catch((error) => {
                        console.error('Error in detectFrame:', error);
                        reject(error); // Reject the Promise in case of an error
                    });
            }); //return new Promise
        } //detectFrame()

        // Request the next animation frame to create a loop
        function animate() {
            detectFrame()
                .then(() => {
                    animationFrameId = requestAnimationFrame(animate);
                })
                .catch((error) => {
                    console.error('Error in animate:', error);
                });
        } //animate()

        animate();
                
    } //detect(imageData)



    // Detect the hand from the webcam | Estimate the position of the hand
    static async runHandPose() {
        
        const handposeDetector = new HandposeDetector();

        // Detect the hand from the webcam
        const video = document.getElementById('video');
        const imageData = await HandposeDetector.captureImageData(video);
        console.log('imageData2:', imageData);

        // Create detector
        const detector = await HandposeDetector._createDetector();
        console.log('Creating the detector successful!');

        // Estimate the position of the hand
        handposeDetector.detect(imageData);        

    } //runHandPose()
    
    // 비디오 멈춤
    static async stopVideo() {
        cancelAnimationFrame(animationFrameId);
    } //stopVideo()

} //HandposeDetector class

    // 코드 실행 
    async function app() {
        try {
            const camera = await Camera.setupCamera();
            console.log(tf.getBackend());
            detector = await HandposeDetector._createDetector();
            console.log(tf.getBackend());
            HandposeDetector.renderPrediction();
        } catch (error) {
            console.error('Error setting up the camera:', error);
        }
    }; //app()

    app();


module.exports = HandposeDetector;