/**
 * estimateHands 함수 이용하여 로컬 로직에서 손 좌표 예측
 *  1. _createDetector() : 모델 로드 성공
 *  2. detector.estimateHands(imageData) : 예측된 손 좌표 콘솔에 출력 성공
 *  3. draw(canvas) : 카메라에 손 좌표 그리기 -> khr_draw 브랜치에서 할 것! 
 */

require('@mediapipe/hands')
const tf = require('@tensorflow/tfjs')
tf.setBackend('webgl')
require('@tensorflow/tfjs-converter')
require('@tensorflow/tfjs-core')

const { createDetector, SupportedModels }  = require('@tensorflow-models/hand-pose-detection')

const Detector = require('./detector');
const HandPoseCamera = require('./handpose-camera');


class HandposeDetector extends Detector {
    
    // model loading & create detector
    static _createDetector() {
        const hands = SupportedModels.MediaPipeHands;
        console.log('hands: ', hands);
        const detector =  createDetector(hands, {
        runtime: 'tfjs',
        modelType: 'lite', //or lite
        maxHands: 2, // or 2~10.
        detectorModelUrl: '/static/tensorflow-models/tfjs-model_handpose_3d_detector_lite_1/model.json',
        landmarkModelUrl: '/static/tensorflow-models/tfjs-model_handpose_3d_landmark_lite_1/model.json'
        })
        console.log('detector: ', detector);
        return detector;
    }

    // estimate hands
    static async detect(imageData) {
        // 모델 로딩
        const detector = await HandposeDetector._createDetector();
        console.log('detector: ', detector);

        // // 비디오에 손 좌표 그리기
        // const handposeCamera = new HandPoseCamera();
        // handposeCamera.drawCtx();
        // // 손이 감지되면 drawResults() 함수를 사용하여 손의 위치를 시각화
        // if (hands && hands.length > 0) {
        //     handposeCamera.drawResults(hands);
        // }

        // 손 좌표 값 예측
        const predictions = await detector.estimateHands(imageData);
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
            }
        }


        return predictions;
    }

    // draw keypoints 
    static async draw(canvas) {
        
    }

 

}

module.exports = HandposeDetector;