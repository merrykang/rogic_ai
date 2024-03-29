const { createDetector, SupportedModels, util } = require('@tensorflow-models/face-landmarks-detection');
const Detector = require("./detector");

var user = {};
var faceMatcher = null;

class FaceDetector extends Detector {
    constructor() {
        super();
        this._result;
    }

    /**
     * '사용자 얼굴 추가' 와 관련된 함수(static)
     *  - 기존 face-api 사용하던 detector-face.js에서 복붙, 로컬 로직에서 블록 형태 이상 현상 방지 위함
     *  - 향후 scratch-blocks, scratch-gui 코드와 함께 수정 필요
     */
    static get userList () {
        return Object.keys(user);
    }

    static faceapiLoadedChecker () {
        return new Promise((resolve, reject) => {
            if (FaceDetector.isFaceapiLoaded) {
                return resolve();
            }

            let startTime = Date.now();
            const checker = setInterval(() => {
                if (FaceDetector.isFaceapiLoaded) {
                    clearInterval(checker);
                    resolve();
                } else {
                    if (Date.now() - startTime > 30000) {
                        clearInterval(checker);
                        return reject();
                    }
                }
            }, 500);
        })
        // return null;
    }

    static prepare() {
        if (FaceDetector.delayLoader) {
            return FaceDetector.delayLoader;
        }
        // return null;
        return FaceDetector.delayLoader = FaceDetector.faceapiLoadedChecker()
            .then(() => FaceDetector.firstDetect())
            .then(() => {
                FaceDetector.isFirstDetected = true;
            })
            .catch(() => {
                /**
                 * 첫 이미지 사전 처리 실패, faceapi 불러오기 지연 또는 실패로 예상되며
                 * 추후 실패했을 경우 경고 GUI 제공 또는 기타 처리 필요 예상.
                 */
                console.warn('첫 이미지 사전 처리 실패, faceapi 불러오기 지연 또는 실패로 예상');
            });
    }

    static get isPrepare () {
        return FaceDetector.delayLoader && FaceDetector.isFirstDetected;
    }

    static get distance () {
        return 0.4;
    }

    static singleFaceDescriptor (element) {
        const useTinyModel = true;
        return null;
    }

    static setUserFace (name, descriptors) {
        if (!name) {return;}
        if (descriptors && descriptors.length > 0) {
            user[name] = descriptors;
        } else {
            if (name in user) {
                delete user[name];
            }
        }

        if (!user || user.length === 0) {
            faceMatcher = null;
            return;
        }

        const keys = this.userList;
        // if (keys && keys.length > 0) {
        //     const labelDescriptors = keys.map(key => new faceapi.LabeledFaceDescriptors(key, user[key]))
        //     if (labelDescriptors) {
        //         faceMatcher = new faceapi.FaceMatcher(labelDescriptors, FaceDetector.distance);
        //     }
        // } else {
        //     faceMatcher = null;
        // }
    }

    /**
     * face-landmarks-detection과 관련된 함수
     */
    enable() {
        super.enable();
        this._canvas = document.createElement("canvas");
        this._canvas.width = Detector.DIMENSIONS[0];
        this._canvas.height = Detector.DIMENSIONS[1];
        this._context = this._canvas.getContext("2d");
    }

    disable() {
        super.disable();
        delete this._context;
        delete this._canvas;
        this._context = null;
        this._canvas = null;
    }

    _createDetector() {
        const model = SupportedModels.MediaPipeFaceMesh;
        const detector = createDetector(model, {
            runtime: 'tfjs',
            maxFaces: 5,
            detectorModelUrl: '/static/tensorflow-models/face_detection_short/model.json',
            landmarkModelUrl: '/static/tensorflow-models/face_landmarks_detection/model.json'
        })
        return detector;
    }

    async detect(imageData) {
        if (!this._detector) {
            this._detector = await this._createDetector();
            console.log("model loading success!, detector: ", this._detector);
        }
        this._result = await this._detector.estimateFaces(imageData);
        console.log('this._result: ', this._result);
        
        for (let i = 0; i < this._result.length; i++) {
            console.log(`============================= ${i+1} 번째 얼굴 =============================`);
            const keypoints = this._result[i].keypoints;
            for (let j = 0; j < keypoints.length; j++) {
                if (keypoints[j].name != undefined) {
                    let x = keypoints[j].x - 320;
                    let y = keypoints[j].y - 240;
                    console.log(`${keypoints[j].name}: [${x}, ${y}]`);
                }  
            }
        }
        return this._result;
    }

    draw(canvas) {
        if (!canvas || !this.isExistContent(this._result)) return canvas;
     
        const ctx = canvas.getContext("2d");
        this._result.forEach((res) => {
            // bounding box 그리기
            if (res.box) {
              ctx.strokeStyle = "Blue";
              ctx.lineWidth = 3;
              const box = res.box;
              this._drawPath(
                  canvas,
                  [
                    [box.xMin, box.yMin], [box.xMax, box.yMin], [box.xMax, box.yMax],
                    [box.xMin, box.yMax]
                  ],
                  true);
            }
            
            // 눈, 눈동자, 입, 얼굴형 그리기
            const keypoints = res.keypoints.map((keypoint) => [keypoint.x, keypoint.y]);

                // draw nose
            const noseKeypoints = [8, 168, 6, 197, 195, 5, 4, 19, 94, 2]
            const nosePath = noseKeypoints.map((index) => keypoints[index]);
            ctx.fillStyle = "#ED5AB3";
            nosePath.forEach(([x, y]) => { 
                ctx.beginPath();
                ctx.arc(x, y, 3/* radius */, 0, 2 * Math.PI);
                ctx.fill();
            });
            ctx.strokeStyle = "#45FFCA"; 
            ctx.lineWidth = 1.3;
            if (nosePath.every(value => value != undefined)) {
                this._drawPath(canvas, nosePath, false);
            }

                // draw etc
            const contours = util.getKeypointIndexByContour(SupportedModels.MediaPipeFaceMesh);
            for (const [label, contour] of Object.entries(contours)) {
                if (label !== 'leftIris' && label !== 'rightIris') {
                    const path = contour.map((index) => keypoints[index]);
                    if (path.every(value => value != undefined)) { 
                        ctx.fillStyle = '#ED5AB3';
                        path.forEach(([x, y]) => { // 각 키포인트를 그리는 반복문
                            ctx.beginPath();
                            ctx.arc(x, y, 3 /* radius */, 0, 2 * Math.PI);
                            ctx.fill();
                        });

                        ctx.strokeStyle = '#45FFCA';  
                        ctx.lineWidth = 1.3;
                        this._drawPath(canvas, path, false);
                    }
                }          
            }
          });
        return canvas;
    }

    _drawPath(canvas, points, closePath) {
        const ctx = canvas.getContext("2d");
        const region = new Path2D();
        region.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            region.lineTo(point[0], point[1]);
        }
        if (closePath) {
            region.closePath();
        }
        ctx.stroke(region);
    }

    _distance(a, b) {
        return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
    }

}

module.exports = FaceDetector;
