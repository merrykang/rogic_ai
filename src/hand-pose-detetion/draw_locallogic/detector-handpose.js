/**
 * draw(canvas) : 카메라에 손 좌표 그리기
 *  1. 기존 handpose-camera 코드(tensorflow.js 깃헙 코드와 유사)에서 drawKeypoints(), drawPath() 코드만 남김 
 *  2. detector-manager.js의 _detect(type, imageData) 함수의 컨벤션을 유지하며 기능 구현 완료 
 *  3. khr 브랜치 : 현재 이 기능 유지하여 코드 정리 -> 차장님 피드백 받아 프로젝트 완료
 */

require("@mediapipe/hands");
const tf = require("@tensorflow/tfjs");
tf.setBackend("webgl");
require("@tensorflow/tfjs-converter");
require("@tensorflow/tfjs-core");

const {createDetector,SupportedModels} = require("@tensorflow-models/hand-pose-detection");

const Detector = require("./detector");

// 손 키포인트 매칭(딕셔너리)
const fingerLookupIndices = {
    thumb: [0, 1, 2, 3, 4],
    indexFinger: [0, 5, 6, 7, 8],
    middleFinger: [0, 9, 10, 11, 12],
    ringFinger: [0, 13, 14, 15, 16],
    pinky: [0, 17, 18, 19, 20],
};

class HandposeDetector extends Detector {
    constructor() {
        super();
        this._result;
    }
    // Setting Dimensions
    enable() {
        super.enable();
        this._canvas = document.createElement("canvas");
        this._canvas.width = Detector.DIMENSIONS[0];
        this._canvas.height = Detector.DIMENSIONS[1];
        this._context = this._canvas.getContext("2d");
    }

    disable() {
        super.disable();
    }

    // model loading
    _createDetector() {
        const hands = SupportedModels.MediaPipeHands;
        const detector = createDetector(hands, {
            runtime: "tfjs",
            modelType: "lite", //or lite
            maxHands: 2, // or 2~10.
            detectorModelUrl:
                "/static/tensorflow-models/tfjs-model_handpose_3d_detector_lite_1/model.json",
            landmarkModelUrl:
                "/static/tensorflow-models/tfjs-model_handpose_3d_landmark_lite_1/model.json",
        });
        console.log("model loading success!: ", detector);
        return detector;
    }

    // estimate hands
    async detect(imageData) {
        // 모델 로딩
        if (this._detector == null) {
            this._detector = await this._createDetector();
            console.log("detector: ", this._detector);
        }

        // 손 좌표 값 예측
        this._result = await this._detector.estimateHands(imageData);
        console.log(`this._result: `, this._result);

        for (let i = 0; i < this._result.length; i++) {
            const handedness = this._result[i].handedness;
            const keypoints = this._result[i].keypoints;

            if (handedness === "Left") {
                console.log("Left hand keypoints:");
            } else if (handedness === "Right") {
                console.log("Right hand keypoints:");
            }

            for (let j = 0; j < keypoints.length; j++) {
                let x = keypoints[j].x;
                let y = keypoints[j].y;

                // Reset the axis to match the Rogic axis
                if (x >= 320 && y >= 240) {
                    // The first quadrant
                    x = Math.abs(x - 320);
                    y = Math.abs(y - 240);
                } else if (x < 320 && y >= 240) {
                    // The second quadrant
                    x = -Math.abs(x - 320);
                    y = Math.abs(y - 240);
                } else if (x < 320 && y < 240) {
                    // The third quadrant
                    x = -Math.abs(x - 320);
                    y = -Math.abs(y - 240);
                } else {
                    // The fourth quadrant
                    x = Math.abs(x - 320);
                    y = -Math.abs(y - 240);
                }
                console.log(`Keypoint ${j}: [${x}, ${y}]`);
            }
        }

        return this._result;
    }

    // draw keypoints
    draw(canvas) {
        for (let i = 0; i < this._result.length; ++i) {
            this.drawKeypoints(canvas,this._result[i].keypoints,this._result[i].handedness);
        }
        return canvas;
    }

    /**
     * 손의 키포인트를 그리는 함수
     * @param keypoints 키포인트의 배열
     * @param handedness 손잡이 정보 (왼쪽 또는 오른쪽)
     */
    drawKeypoints(canvas, keypoints, handedness) {
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = handedness === "Left" ? "Red" : "Blue";
        ctx.strokeStyle = "White";
        ctx.lineWidth = 2;

        // 각 키포인트를 캔버스에 그림
        for (let i = 0; i < keypoints.length; i++) {
            const y = keypoints[i].x;
            const x = keypoints[i].y;
            this.drawPoint(ctx, x - 2, y - 2, 3);
        }

        //손가락 간 경로를 그림
        const fingers = Object.keys(fingerLookupIndices);
        for (let i = 0; i < fingers.length; i++) {
            const finger = fingers[i];
            const points = fingerLookupIndices[finger].map(
                (idx) => keypoints[idx]
            );
            this.drawPath(canvas, points, false);
        }
    }

    /**
     * 점들의 경로를 그리는 함수
     * @param points : 점들의 배열
     * @param closePath : 경로를 닫을지 여부
     * Path2D 객체를 사용 -> 점들을 연결 -> 경로를 그림
     */
    drawPath(canvas, points, closePath) {
        const ctx = canvas.getContext("2d");
        const region = new Path2D();
        region.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            region.lineTo(point.x, point.y);
        }
        if (closePath) {
            region.closePath();
        }
        ctx.stroke(region);
    }

    // 점을 그리는 함수 : x, y 좌표를 중심으로 한 반지름 r의 원을 그림
    drawPoint(ctx, y, x, r) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();
    }
}

module.exports = HandposeDetector;
