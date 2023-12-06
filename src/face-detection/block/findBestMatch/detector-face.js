const { createDetector, SupportedModels, util } = require('@tensorflow-models/face-landmarks-detection');
const Detector = require("./detector");
const { LabeledFaceDescriptors, FaceMatcher } = require('./detector-face-block')

var user = {};
var faceMatcher = null;

const MODEL = SupportedModels.MediaPipeFaceMesh;

class FaceDetector extends Detector {
    constructor() {
        super();
        this._result;
    }

    /**
     * '사용자 얼굴 정하기' 와 관련된 함수
     */
    static get userList () {
        return Object.keys(user);
    }

    //TODO: faceapi 관련 사용하지 않는 함수 VM, GUI 전체적으로 유지보수 필요
    static prepare() {
        // if (FaceDetector.delayLoader) {
        //     return FaceDetector.delayLoader;
        // }
        return null;
    //     // return FaceDetector.delayLoader = FaceDetector.faceapiLoadedChecker()
    //     //     .then(() => FaceDetector.firstDetect())
    //     //     .then(() => {
    //     //         FaceDetector.isFirstDetected = true;
    //     //     })
    //     //     .catch(() => {
    //     //         /**
    //     //          * 첫 이미지 사전 처리 실패, faceapi 불러오기 지연 또는 실패로 예상되며
    //     //          * 추후 실패했을 경우 경고 GUI 제공 또는 기타 처리 필요 예상.
    //     //          */
    //     //         console.warn('첫 이미지 사전 처리 실패, faceapi 불러오기 지연 또는 실패로 예상');
    //     //     });
    }


    static get distance () {
        return 0.7;
    }

    // 전체적으로 변수명 예쁘게 수정 (함수명은 기존 파일들과 연결되어야 하므로 수정되면 안 됨)
    static async singleFaceDescriptor(element) {
        console.log('element', element)
        const faceDetector = new FaceDetector();
        if (!this._detector) {  // detector 한 번만 생성되도록 수정
            await faceDetector._createDetector().then(detector => {
                this._detector = detector;
                console.log("model loading success!, detector: ", this._detector);
            })
        }
        return await this._detector.estimateFaces(element).then(result => {
            const keypointsArray = [];
            result[0].keypoints.forEach(keypoint => {
                keypointsArray.push(keypoint.x);
                keypointsArray.push(keypoint.y);
                keypointsArray.push(keypoint.z);  // z축까지 필요한지 확인 -> 질문해보고 수정
            });
            console.log('keypointsArray: ', keypointsArray)
            const descriptor = new Float32Array(keypointsArray);
            // const extendedObj = faceDetector._withFaceDescriptor(result, descriptor);
            // console.log('extendedObj: ', extendedObj);
            return Promise.resolve(descriptor);
        });
    }

    // _withFaceDescriptor(sourceObj, descriptor) {
    //     const extension = { descriptor: descriptor }
    //     return Object.assign({}, sourceObj, extension)
    // }

    static setUserFace(name, descriptors) {

        // if (!name) {return;}
        // if (descriptors && descriptors.length > 0) {
            user[name] = descriptors;
        // } else {
        //     if (name in user) {
        //         delete user[name];
        //     }
        // }

        // if (!user || user.length === 0) {
        //     faceMatcher = null;
        //     return;
        // }

        const keys = this.userList;
        // if (keys && keys.length > 0) {
        const labelDescriptors = keys.map(key => new LabeledFaceDescriptors(key, user[key]))
        console.log('labelDescriptors', labelDescriptors)
            // if (labelDescriptors) {
        faceMatcher = new FaceMatcher(labelDescriptors, FaceDetector.distance);
        console.log('faceMatcher: ', faceMatcher)
        //     }
        // } else {
        //     faceMatcher = null;
        // }
    }

    /**
     * Tensorflow-models: face-landmarks-detection
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
        const detector = createDetector(MODEL, {
            runtime: 'tfjs',
            maxFaces: 5,
            flipHorizontal: false,
            refineLandmarks: false,
            staticImageMode: true,
            detectorModelUrl: '/static/tensorflow-models/face_detection_short/model.json',
            landmarkModelUrl: '/static/tensorflow-models/face_landmarks_detection/model.json'
        })
        return detector;
    }

    detect(imageData) {
        if (!this._detector) {
            this._createDetector().then(detector => {
                this._detector = detector;
                console.log("model loading success!, detector: ", this._detector);
            })
        }

        return new Promise((resolve, reject) => {   
            this._detector.estimateFaces(imageData).then(result => {
                this._result = result;
                const keypointArray = [];
                this._result.forEach((res, i) => {
                    console.log(`============================= ${i + 1} 번째 얼굴 =============================`);
                    res.keypoints.forEach((keypoint) => {
                        keypointArray.push(keypoint.x);
                        keypointArray.push(keypoint.y);
                        keypointArray.push(keypoint.z);


                        // if (keypoint.name != undefined) {
                        //     let x = keypoint.x - 320;
                        //     let y = keypoint.y - 240;
                        //     console.log(`${keypoint.name}: [${x}, ${y}]`);
                        // }
                    })
                    // console.log('keypointArray: ', keypointArray);
                    const descriptor = new Float32Array(keypointArray);
                    console.log('descriptor: ', descriptor)
                    const results = faceMatcher.findBestMatch(descriptor);
                    console.log('results: ', results)
                    res.id = results._label
                })
                console.log(`this._result: `, this._result);
                resolve(this._result);
            }).catch(e => {
                reject(e);
            });
        })
    }

    draw(canvas) {
        if (!canvas || !this.isExistContent(this._result)) return canvas;
        const ctx = canvas.getContext("2d");
        if (this._result) {
            this._result.forEach((res) => {
                // Draw bounding box
                if (res.box) {
                    ctx.strokeStyle = "Blue";
                    ctx.lineWidth = 3;
                    const box = res.box;
                    this._drawPath(
                        ctx,
                        [[box.xMin, box.yMin], [box.xMax, box.yMin], [box.xMax, box.yMax],[box.xMin, box.yMax]],
                        true);
                }
                
                // Draw nose
                const keypoints = res.keypoints.map((keypoint) => [keypoint.x, keypoint.y]);
                const noseIndices = [8, 168, 6, 197, 195, 5, 4, 19, 94, 2];
                this._drawKeypoint(ctx, keypoints, noseIndices, "#ED5AB3");
    
                // Draw other parts
                const contours = util.getKeypointIndexByContour(MODEL);
                for (const [label, contour] of Object.entries(contours)) {
                    if (label !== 'leftIris' && label !== 'rightIris') {
                        this._drawKeypoint(ctx, keypoints, contour, "#ED5AB3");
                    }          
                }
            });
        }
        return canvas;
    }

    _drawKeypoint(ctx, keypoints, indices, color) {
        const points = indices.map((index) => keypoints[index]);
        if (points.every(value => value != undefined)) {
            ctx.fillStyle = color;
            points.forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, 3 /* radius */, 0, 2 * Math.PI);
                ctx.fill();
            });
            ctx.strokeStyle = '#45FFCA';  
            ctx.lineWidth = 1.3;
            this._drawPath(ctx, points, false);
        }
    }

    _drawPath(ctx, points, closePath) {
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
}

module.exports = FaceDetector;
