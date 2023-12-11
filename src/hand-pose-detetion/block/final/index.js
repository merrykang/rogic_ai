const Runtime = require('../../engine/runtime');
const Clone = require('../../util/clone');
const Cast = require('../../util/cast');
const {ArgumentType} = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');

const Camera = require('../../io/camera');
const CameraBlocks = require('../camera-blocks');
const DetectionType = require('../../util/image-processing/detection-type');
const ColorDetector = require('../../util/image-processing/detector-color');
const Colours = require('../block-colours');

const CameraType = {
    WEBCAM: 'webcam',
    CAMERAMODULE: 'cameraModule'
}

const ModuleType = {
    CLASSIFIER: 'classifier',
    DETECTOR: 'detector'
}

const FaceParts = {
    EYE_LEFT: 'leftEye',
    EYE_RIGHT: 'rightEye',
    EYEBROW_LEFT: 'leftEyeBrow',
    EYEBROW_RIGHT: 'rightEyeBrow',
    NOSE: 'nose',
    MOUTH: 'mouth',
    JAW: 'jaw'
}

// 추가 : hand-pose-detection
const Handedness = {
    LEFT: 'Left',
    RIGHT: 'Right',
    BOTH: 'Both'
}

const HandednessParts = {
    LEFT: 'Left',
    RIGHT: 'Right'
}

const HandposeParts = {
    THUMB: 'thumb',
    INDEX: 'index',
    MIDDLE: 'middle',
    RING: 'ring',
    PINKY: 'pinky',
    PALM: 'palm'
}

//const Expressions = {
//    ANGRY: 'angry',
//    DISGUSTED: 'disgusted',
//    FEARFUL: 'fearful',
//    HAPPY: 'happy',
//    NEUTRAL: 'neutral',
//    SAD: 'sad',
//    SURPRISED: 'surprised',
//}

//const Genders = {
//    MALE: 'male',
//    FEMALE: 'female',
//}

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyNi4zLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0i66CI7J207Ja0XzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCINCgkgeT0iMHB4IiB2aWV3Qm94PSIwIDAgNDAgNDAiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQwIDQwOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPg0KCS5zdDB7ZmlsbDojNEQ0RDREO30NCgkuc3Qxe2ZpbGw6I0ZGRkZGRjtzdHJva2U6I0ZGRkZGRjtzdHJva2Utd2lkdGg6MC44O3N0cm9rZS1taXRlcmxpbWl0OjEwO30NCjwvc3R5bGU+DQo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMzAuNzU5LDE0LjM4NmwtNi4yOCwzLjYyNlYxNS4zN2MwLTEuOTAzLTEuNTU3LTMuNDYtMy40Ni0zLjQ2aC05LjE4NWMtMS45MDMsMC0zLjQ2LDEuNTU3LTMuNDYsMy40NnY4Ljc4NQ0KCWMwLDEuOTAzLDEuNTU3LDMuNDYsMy40NiwzLjQ2aDkuMTg1YzEuOTAzLDAsMy40Ni0xLjU1NywzLjQ2LTMuNDZ2LTIuNjQxbDYuMjgsMy42MjZjMC4zODUsMC4yMjIsMC44NjYtMC4wNTYsMC44NjYtMC41di05Ljc1NA0KCUMzMS42MjUsMTQuNDQxLDMxLjE0NCwxNC4xNjMsMzAuNzU5LDE0LjM4NnoiLz4NCjxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iMTIuODY1LDQuOCA2LjAwMiw0LjggNC44LDQuOCA0LjgsNi4wMDIgNC44LDEyLjg2NSA2LjAwMiwxMi44NjUgNi4wMDIsNi4wMDIgMTIuODY1LDYuMDAyICIvPg0KPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSIzNS4yLDEyLjg2NSAzNS4yLDYuMDAyIDM1LjIsNC44IDMzLjk5OCw0LjggMjcuMTM1LDQuOCAyNy4xMzUsNi4wMDIgMzMuOTk4LDYuMDAyIDMzLjk5OCwxMi44NjUgIi8+DQo8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjI3LjEzNSwzNS4yIDMzLjk5OCwzNS4yIDM1LjIsMzUuMiAzNS4yLDMzLjk5OCAzNS4yLDI3LjEzNSAzMy45OTgsMjcuMTM1IDMzLjk5OCwzMy45OTggDQoJMjcuMTM1LDMzLjk5OCAiLz4NCjxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iNC44LDI3LjEzNSA0LjgsMzMuOTk4IDQuOCwzNS4yIDYuMDAyLDM1LjIgMTIuODY1LDM1LjIgMTIuODY1LDMzLjk5OCA2LjAwMiwzMy45OTggNi4wMDIsMjcuMTM1ICIvPg0KPC9zdmc+DQo=';
const menuIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyNi4zLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0i66CI7J207Ja0XzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCINCgkgeT0iMHB4IiB2aWV3Qm94PSIwIDAgNDAgNDAiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQwIDQwOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPg0KCS5zdDB7ZmlsbDojNEQ0RDREO30NCgkuc3Qxe2ZpbGw6I0U4MDAwMDtzdHJva2U6I0U4MDAwMDtzdHJva2Utd2lkdGg6MC44O3N0cm9rZS1taXRlcmxpbWl0OjEwO30NCjwvc3R5bGU+DQo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMzAuNzU5LDE0LjM4NmwtNi4yOCwzLjYyNlYxNS4zN2MwLTEuOTAzLTEuNTU3LTMuNDYtMy40Ni0zLjQ2aC05LjE4NWMtMS45MDMsMC0zLjQ2LDEuNTU3LTMuNDYsMy40NnY4Ljc4NQ0KCWMwLDEuOTAzLDEuNTU3LDMuNDYsMy40NiwzLjQ2aDkuMTg1YzEuOTAzLDAsMy40Ni0xLjU1NywzLjQ2LTMuNDZ2LTIuNjQxbDYuMjgsMy42MjZjMC4zODUsMC4yMjIsMC44NjYtMC4wNTYsMC44NjYtMC41di05Ljc1NA0KCUMzMS42MjUsMTQuNDQxLDMxLjE0NCwxNC4xNjMsMzAuNzU5LDE0LjM4NnoiLz4NCjxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iMTIuODY1LDQuOCA2LjAwMiw0LjggNC44LDQuOCA0LjgsNi4wMDIgNC44LDEyLjg2NSA2LjAwMiwxMi44NjUgNi4wMDIsNi4wMDIgMTIuODY1LDYuMDAyICIvPg0KPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSIzNS4yLDEyLjg2NSAzNS4yLDYuMDAyIDM1LjIsNC44IDMzLjk5OCw0LjggMjcuMTM1LDQuOCAyNy4xMzUsNi4wMDIgMzMuOTk4LDYuMDAyIDMzLjk5OCwxMi44NjUgIi8+DQo8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjI3LjEzNSwzNS4yIDMzLjk5OCwzNS4yIDM1LjIsMzUuMiAzNS4yLDMzLjk5OCAzNS4yLDI3LjEzNSAzMy45OTgsMjcuMTM1IDMzLjk5OCwzMy45OTggDQoJMjcuMTM1LDMzLjk5OCAiLz4NCjxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iNC44LDI3LjEzNSA0LjgsMzMuOTk4IDQuOCwzNS4yIDYuMDAyLDM1LjIgMTIuODY1LDM1LjIgMTIuODY1LDMzLjk5OCA2LjAwMiwzMy45OTggNi4wMDIsMjcuMTM1ICIvPg0KPC9zdmc+DQo='

class ImageProcessing {
    constructor (runtime) {
        this._runtime = runtime;
        this.classifierManager = this._runtime.classifierManager;
        this.detectorManager = this._runtime.detectorManager;

        //[TODO]: 모듈이 불려와져 있는 상태에서 다시 호출됬을때 임시처리 Promise(() => { });
        const detectModuleLoad = () => {
            if (!this.detectorManager.isPrepare) return this.detectorManager.prepareDetector()
                .then(() => this._runtime.emit(Runtime.END_LOADING_MODULE, ModuleType.DETECTOR, true))
                .catch(() => this._runtime.emit(Runtime.END_LOADING_MODULE, ModuleType.DETECTOR, false));
            else return new Promise(() => { });
        }
        const classifierModuleLoad = () => {
            if (!this.classifierManager.isLoaded) return this.classifierManager.loadClassifier()
                .then(() => this._runtime.emit(Runtime.END_LOADING_MODULE, ModuleType.CLASSIFIER, true))
                .catch(() => this._runtime.emit(Runtime.END_LOADING_MODULE, ModuleType.CLASSIFIER, false));
            else return new Promise(() => { });
        }

        classifierModuleLoad().then(() => detectModuleLoad());
    }

    dispose () {

    }

    get camera () {
        return this._camera;
    }

    set camera (io) {
        this._camera = io;
    }

    get EXTENSION_NAME () {
        return 'image processing';
    }

    get EXTENSION_ID () {
        return 'imageProcessing';
    }

    get stage () {
        return this._runtime.getTargetForStage();
    }

    get EXTENSION_NAME () {
        return;
    }

    /**
     * Get the latest values for cameraModule transparency and state,
     * and set the cameraModule device to use them.
     */
    _updateDisplay () {
        this.setTransparency({
            TRANSPARENCY: this.globalTransparency
        });
        this.toggle(this.globalState);
    }

    /**
     * Create data for a menu in scratch-blocks format, consisting of an array
     * of objects with text and value properties. The text is a translated
     * string, and the value is one-indexed.
     * @param {object[]} info - An array of info objects each having a name
     *   property.
     * @return {array} - An array of objects with text and value properties.
     * @private
     */
    _buildMenu (info) {
        // scratch-block FieldDropdown class로 바로 보낼 함수
        // FieldDropdown class는 obj타입이 아닌 array로 [0]이 이름 [1]이 값으로 구성되어 있음. 
        if (typeof info === 'function') return function () {
            return info().map((entry, index) => {
                const obj = [];
                obj.push(entry.name);
                obj.push(entry.value || String(index + 1));
                return obj;
            });
        }
        return info.map((entry, index) => {
            const obj = {};
            obj.text = entry.name;
            obj.value = entry.value || String(index + 1);
            return obj;
        });
    }

    /**
     * @param {Target} target - collect motion state for this target.
     * @returns {MotionState} the mutable motion state associated with that
     *   target. This will be created if necessary.
     * @private
     */
    _getMotionState (target) {
        let motionState = target.getCustomState(this.constructor.STATE_KEY);
        if (!motionState) {
            motionState = Clone.simple(CameraBlocks.DEFAULT_MOTION_STATE);
            target.setCustomState(this.constructor.STATE_KEY, motionState);
        }
        return motionState;
    }

    static get ModuleType () {
        return ModuleType;
    }

    static get CameraType () {
        return CameraType;
    }

    get CAMERA_TYPE () {
        return [
            {
                name: formatMessage({
                    id: 'imageProcessing.camera.webcam',
                    default: '웹캠',
                    description: 'usb 카메라 or 노트북 카메라'
                }),
                value: CameraType.WEBCAM
            }, {
                name: formatMessage({
                    id: 'imageProcessing.camera.cameraModule',
                    default: '카메라 모듈',
                    description: 'ip 카메라'
                }),
                value: CameraType.CAMERAMODULE
            }
        ];
    }

    static get DetectionType () {
        return DetectionType;
    }

    get DETECTION_TYPE () {
        return [
            {
                name: formatMessage({
                    id: 'imageProcessing.type.marker',
                    default: '마커',
                    description: '마커'
                }),
                value: DetectionType.MARKER
            },
            {
                name: formatMessage({
                    id: 'imageProcessing.type.qrcode',
                    default: 'QR 코드',
                    description: 'QR 코드'
                }),
                value: DetectionType.QRCODE
            },
            {
                name: formatMessage({
                    id: 'imageProcessing.type.face',
                    default: '얼굴',
                    description: '얼굴'
                }),
                value: DetectionType.FACE
            },
            // 추가 : hand-pose-detection
            {
                name: formatMessage({
                    id: 'imageProcessing.type.handpose',
                    default: '손 모양',
                    description: '손 모양'
                }),
                value: DetectionType.HANDPOSE
            },
            {
                name: formatMessage({
                    id: 'imageProcessing.type.color',
                    default: '색깔',
                    description: '색깔'
                }),
                value: DetectionType.COLOR
            }
        ];
    }

    get DETECTION_ADD_ON () {
        return [
            {
                name: formatMessage({
                    id: 'imageProcessing.type.classifier',
                    default: '이미지 분류',
                    description: '이미지 분류'
                }),
                value: DetectionType.IMAGE_CLASSIFIER
            }
        ];
    }

    get DETECTION_STATE () {
        return [
            {
                name: formatMessage({
                    id: 'imageProcessing.on',
                    default: 'on',
                    description: 'Option for the "turn cameraModule [STATE]" block'
                }),
                value: CameraBlocks.State.ON
            },
            {
                name: formatMessage({
                    id: 'imageProcessing.off',
                    default: 'off',
                    description: 'Option for the "turn cameraModule [STATE]" block'
                }),
                value: CameraBlocks.State.OFF
            }
        ];
    }

    get USER_NAME () {
        const builder = function () {
            const userNames = [];
            this.detectorManager.faceDetector.userList.map(name => {
                userNames.push({
                    name: `${name}`,
                    value: `${name}`
                })
            });
            userNames.push({
                name: formatMessage({
                    id: 'imageProcessing.any',
                    default: '아무나',
                    description: '사용자 관련'
                }),
                value: 'any'
            });

            return userNames;
        }

        return builder.bind(this);
    }

    static get FaceParts () {
        return FaceParts;
    }

    /**
     * 추가 : hand-pose-detection 
     * */ 
    static get Handedness () {
        return Handedness;
    }

    static get HandednessParts() {
        return HandednessParts;
    }

    static get HandposeParts () {
        return HandposeParts;
    }

    get FACE_PARTS () {
        return [
            {
                name: formatMessage({
                    id: 'imageProcessing.face.lefteye',
                    default: '왼쪽 눈',
                    description: '왼쪽 눈'
                }),
                value: FaceParts.EYE_LEFT
            }, {
                name: formatMessage({
                    id: 'imageProcessing.face.lefteyebrow',
                    default: '왼쪽 눈썹',
                    description: '왼쪽 눈썹'
                }),
                value: FaceParts.EYEBROW_LEFT
            },
            {
                name: formatMessage({
                    id: 'imageProcessing.face.righteye',
                    default: '오른쪽 눈',
                    description: '오른쪽 눈'
                }),
                value: FaceParts.EYE_RIGHT
            },
            {
                name: formatMessage({
                    id: 'imageProcessing.face.righteyebrow',
                    default: '오른쪽 눈썹',
                    description: '오른쪽 눈썹'
                }),
                value: FaceParts.EYEBROW_RIGHT
            },
            {
                name: formatMessage({
                    id: 'imageProcessing.face.nose',
                    default: '코',
                    description: '코'
                }),
                value: FaceParts.NOSE
            },
            {
                name: formatMessage({
                    id: 'imageProcessing.face.mouth',
                    default: '입',
                    description: '입'
                }),
                value: FaceParts.MOUTH
            },
            {
                name: formatMessage({
                    id: 'imageProcessing.face.jaw',
                    default: '턱',
                    description: '턱'
                }),
                value: FaceParts.JAW
            }
        ];
    }

    /**
     * 추가 : hand-pose-detection 
     * */ 
    get HANDEDNESS() {
        return [
            {
                name: formatMessage({
                    id: 'imageProcessing.handpose.lefthandedness',
                    default: '왼쪽',
                    description: '왼쪽 손 모양'
                }),
                value: Handedness.LEFT
            }, {
                name: formatMessage({
                    id: 'imageProcessing.handpose.righthandedness',
                    default: '오른쪽',
                    description: '오른쪽 손 모양'
                }),
                value: Handedness.RIGHT
            },
            {
                name: formatMessage({
                    id: 'imageProcessing.handpose.bothhandedness',
                    default: '양쪽',
                    description: '양쪽 손 모양'
                }),
                value: Handedness.BOTH
            },
        ];
    }

    get HANDEDNESS_PARTS() {
        return [
            {
                name: formatMessage({
                    id: 'imageProcessing.handpose.lefthandedness',
                    default: '왼쪽',
                    description: '왼쪽 손 모양'
                }),
                value: Handedness.LEFT
            }, {
                name: formatMessage({
                    id: 'imageProcessing.handpose.righthandedness',
                    default: '오른쪽',
                    description: '오른쪽 손 모양'
                }),
                value: Handedness.RIGHT
            },
        ]
    }

    get HANDPOSE_PARTS() {
        return [
            {
                name: formatMessage({
                    id: 'imageProcessing.handpose.thumb',
                    default: '엄지 손가락',
                    description: '엄지 손가락'
                }),
                value: HandposeParts.THUMB
            }, {
                name: formatMessage({
                    id: 'imageProcessing.handpose.index',
                    default: '검지 손가락',
                    description: '검지 손가락'
                }),
                value: HandposeParts.INDEX
            },
            {
                name: formatMessage({
                    id: 'imageProcessing.handpose.middle',
                    default: '중지 손가락',
                    description: '중지 손가락'
                }),
                value: HandposeParts.MIDDLE
            },
            {
                name: formatMessage({
                    id: 'imageProcessing.handpose.ring',
                    default: '약지 손가락',
                    description: '약지 손가락'
                }),
                value: HandposeParts.RING
            },
            {
                name: formatMessage({
                    id: 'imageProcessing.handpose.pinky',
                    default: '새끼 손가락',
                    description: '새끼 손가락'
                }),
                value: HandposeParts.PINKY
            },
            {
                name: formatMessage({
                    id: 'imageProcessing.handpose.palm',
                    default: '손바닥',
                    description: '손바닥'
                }),
                value: HandposeParts.PALM
            },
        ];
    }

    get CLASS_NAME () {
        const builder = function () {
            const info = [];
            const classifier = this.classifierManager.results;
            for (let i = 0; i < classifier.length; i++) {
                if (classifier[i].name !== null) info.push({
                    name: `${classifier[i].name}`,
                    value: `${classifier[i].name}`
                });
            }
            if (info.length == 0) return [{
                name: '',
                value: ''
            }];
            else return info;
        }
        return builder.bind(this);
    }

    getInfo () {
        return {
            id: this.EXTENSION_ID,
            name: formatMessage({
                id: 'imageProcessing.categoryName',
                default: '영상 처리'/*this.EXTENSION_NAME*/,
                description: 'Label for the pen extension category'
            }),
            blockIconURI: blockIconURI,
            menuIconURI: menuIconURI,
            //showSettingButton: true,
            //showUserInformationButton: true,
            blocks: [
                {
                    opcode: 'cameraToggle',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'imageProcessing.cameraToggle',
                        default: '영상처리를 [CAMERA_TYPE](와)과 함께 사용하기',
                        description: '어느 종류의 카메라에 영상처리를 적용시킬지 수동 설정하기'
                    }),
                    arguments: {
                        CAMERA_TYPE: {
                            type: ArgumentType.STRING,
                            menu: 'cameraType',
                            defaultValue: ImageProcessing.CameraType.WEBCAM
                        }
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                {
                    opcode: 'detectionToggle',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'imageProcessing.detectionToggle',
                        default: '[DETECTION_TYPE] 감지 [DETECTION_STATE]',
                        description: 'Controls display of the cameraModule preview layer'
                    }),
                    arguments: {
                        DETECTION_TYPE: {
                            type: ArgumentType.NUMBER,
                            menu: 'detectionFullType',
                            defaultValue: ImageProcessing.DetectionType.MARKER
                        },
                        DETECTION_STATE: {
                            type: ArgumentType.NUMBER,
                            menu: 'detectionState',
                            defaultValue: CameraBlocks.State.ON
                        }
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                {
                    opcode: 'drawBoxToggle',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'imageProcessing.drawBoxToggle',
                        default: '[DETECTION_TYPE] 감지 영역 표시 [DETECTION_STATE]',
                        description: 'Controls display of the cameraModule preview layer'
                    }),
                    arguments: {
                        DETECTION_TYPE: {
                            type: ArgumentType.NUMBER,
                            menu: 'detectionType',
                            defaultValue: ImageProcessing.DetectionType.MARKER
                        },
                        DETECTION_STATE: {
                            type: ArgumentType.NUMBER,
                            menu: 'detectionState',
                            defaultValue: CameraBlocks.State.ON
                        }
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                '---',
                {
                    opcode: 'detectedMarkers',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'imageProcessing.detectedMarkers',
                        default: '감지 된 마커',
                        description: '감지 된 마커'
                    }),
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                {
                    opcode: 'isMarkerDetected',
                    blockType: BlockType.BOOLEAN,
                    text: formatMessage({
                        id: 'imageProcessing.isMarkerDetected',
                        default: '[MARKER_ID] 번 마커가 감지되었는가?',
                        description: '[MARKER_ID] 번 마커가 감지되었는가?'
                    }),
                    arguments: {
                        MARKER_ID: {
                            type: ArgumentType.WHOLE_NUMBER,
                            defaultValue: 0
                        }
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                {
                    opcode: 'detectedMarkerPositionX',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'imageProcessing.detectedMarkerPositionX',
                        default: '[MARKER_ID] 번 마커의 x 좌표',
                        description: '[MARKER_ID] 번 마커의 x 좌표'
                    }),
                    arguments: {
                        MARKER_ID: {
                            type: ArgumentType.WHOLE_NUMBER,
                            defaultValue: 0
                        }
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                {
                    opcode: 'detectedMarkerPositionY',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'imageProcessing.detectedMarkerPositionY',
                        default: '[MARKER_ID] 번 마커의 y 좌표',
                        description: '[MARKER_ID] 번 마커의 y 좌표'
                    }),
                    arguments: {
                        MARKER_ID: {
                            type: ArgumentType.WHOLE_NUMBER,
                            defaultValue: 0
                        }
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                {
                    opcode: 'detectedMarkerSize',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'imageProcessing.detectedMarkerSize',
                        default: '[MARKER_ID] 번 마커의 크기',
                        description: '[MARKER_ID] 번 마커의 크기'
                    }),
                    arguments: {
                        MARKER_ID: {
                            type: ArgumentType.WHOLE_NUMBER,
                            defaultValue: 0
                        }
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                {
                    opcode: 'detectedMarkerDirection',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'imageProcessing.detectedMarkerDirection',
                        default: '[MARKER_ID] 번 마커의 방향',
                        description: '[MARKER_ID] 번 마커의 방향'
                    }),
                    arguments: {
                        MARKER_ID: {
                            type: ArgumentType.WHOLE_NUMBER,
                            defaultValue: 0
                        }
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                '---',
                {
                    opcode: 'detectedQRCodeValue',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'imageProcessing.detectedQRCodeValue',
                        default: '감지 된 QR 코드 값',
                        description: '감지 된 QR 코드 값'
                    }),
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                {
                    opcode: 'isQRCodeDetected',
                    blockType: BlockType.BOOLEAN,
                    text: formatMessage({
                        id: 'imageProcessing.isQRCodeDetected',
                        default: 'QR 코드가 감지 되었는가?',
                        description: 'QR 코드의 감지 여부'
                    }),
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },

                '---',
                {
                    func: 'MODIFY_USERINFORMATION',
                    blockType: BlockType.BUTTON,
                    text: formatMessage({
                        id: 'imageProcessing.modifyUserinformation',
                        default: '사용자 얼굴 정하기',
                        description: '사용자별 얼굴 인식 데이터 수정 modal창 띄우기'
                    })
                },
                '---',
                {
                    opcode: 'detectedFaceLength',
                    text: formatMessage({
                        id: 'imageProcessing.detectedFaceLength',
                        default: '감지 된 얼굴 수',
                        description: '감지 된 얼굴 수'
                    }),
                    blockType: BlockType.REPORTER,
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                {
                    opcode: 'isFaceDetected',
                    blockType: BlockType.BOOLEAN,
                    text: formatMessage({
                        id: 'imageProcessing.isFaceDetected',
                        default: '[USER_NAME] 이(가) 감지 되었는가?',
                        description: '등록된 사용자의 얼굴 감지 여부'
                    }),
                    arguments: {
                        USER_NAME: {
                            type: ArgumentType.USER_NAME,
                            menu: 'userName',
                            defaultValue: 'any'
                        }
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                //{
                //    opcode: 'isMatchingExpression',
                //    blockType: BlockType.BOOLEAN,
                //    text: formatMessage({
                //        id: 'imageProcessing.isMatchingExpression',
                //        default: '[USER_NAME] 은(는) [EXPRESSION] 표정인가?',
                //        description: '등록된 사용자의 표정 확인'
                //    }),
                //    arguments: {
                //        USER_NAME: {
                //            type: ArgumentType.STRING,
                //            //menu: 'USER_NAME',
                //            defaultValue: 'any'
                //        },
                //        EXPRESSION: {
                //            type: ArgumentType.NUMBER,
                //            menu: 'EXPRESSION',
                //            defaultValue: Expressions.NEUTRAL
                //        }
                //    },
                //    color: Colours.sensing.primary,
                //    colorSecondary: Colours.sensing.secondary,
                //    colorTertiary: Colours.sensing.tertiary
                //},
                //{
                //    opcode: 'isMatchingGender',
                //    blockType: BlockType.BOOLEAN,
                //    text: formatMessage({
                //        id: 'imageProcessing.isMatchingGender',
                //        default: '[USER_NAME] 은(는) [GENDER] 인가?',
                //        description: '등록된 사용자의 표정 확인'
                //    }),
                //    arguments: {
                //        USER_NAME: {
                //            type: ArgumentType.STRING,
                //            //menu: 'USER_NAME',
                //            defaultValue: 'any'
                //        },
                //        GENDER: {
                //            type: ArgumentType.NUMBER,
                //            menu: 'GENDER',
                //            defaultValue: Genders.MALE
                //        }
                //    },
                //    color: Colours.sensing.primary,
                //    colorSecondary: Colours.sensing.secondary,
                //    colorTertiary: Colours.sensing.tertiary
                //},
                {
                    opcode: 'detectedFacePositionX',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'imageProcessing.detectedFacePositionX',
                        default: '[USER_NAME] 의 [FACE_PARTS] 의 x 좌표',
                        description: '등록된 사용자의 얼굴 부위 x 좌표'
                    }),
                    arguments: {
                        USER_NAME: {
                            type: ArgumentType.USER_NAME,
                            menu: 'userName',
                            defaultValue: 'any'
                        },
                        FACE_PARTS: {
                            type: ArgumentType.NUMBER,
                            menu: 'faceParts',
                            defaultValue: ImageProcessing.FaceParts.NOSE
                        }
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                {
                    opcode: 'detectedFacePositionY',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'imageProcessing.detectedFacePositionY',
                        default: '[USER_NAME] 의 [FACE_PARTS] 의 y 좌표',
                        description: '등록된 사용자의 얼굴 부위 y 좌표'
                    }),
                    arguments: {
                        USER_NAME: {
                            type: ArgumentType.USER_NAME,
                            menu: 'userName',
                            defaultValue: 'any'
                        },
                        FACE_PARTS: {
                            type: ArgumentType.NUMBER,
                            menu: 'faceParts',
                            defaultValue: ImageProcessing.FaceParts.NOSE
                        }
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                {
                    opcode: 'detectedFaceSize',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'imageProcessing.detectedFaceSize',
                        default: '[USER_NAME] 의 얼굴 크기',
                        description: '등록된 사용자의 얼굴 크기'
                    }),
                    arguments: {
                        USER_NAME: {
                            type: ArgumentType.USER_NAME,
                            menu: 'userName',
                            defaultValue: 'any'
                        }
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                '---',
                {
                    opcode: 'isHandposeDetected',
                    blockType: BlockType.BOOLEAN,
                    text: formatMessage({
                        id: 'imageProcessing.isHandposeDetected',
                        default: '[HANDEDNESS] 손 모양이 감지 되었는가?',
                        description: '사용자의 왼쪽, 오른쪽, 양쪽 손 모양의 감지 여부'
                    }),
                    arguments: {
                        HANDEDNESS: {
                            type: ArgumentType.STRING,
                            menu: 'handedness',
                            defaultValue: ImageProcessing.Handedness.BOTH
                        }
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                {
                    opcode: 'detectedHandposePositionX',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'imageProcessing.detectedHandposePositionX',
                        default: '[HANDEDNESS_PARTS] 손 모양의 [HANDPOSE_PARTS] 의 x 좌표',
                        description: '사용자의 왼손 또는 오른손 모양 부위 x 좌표'
                    }),
                    arguments: {
                        HANDEDNESS_PARTS: {
                            type: ArgumentType.STRING,
                            menu: 'handednessParts',
                            defaultValue: ImageProcessing.HandednessParts.LEFT
                        },
                        HANDPOSE_PARTS: {
                            type: ArgumentType.NUMBER,
                            menu: 'handposeParts',
                            defaultValue: ImageProcessing.HandposeParts.THUMB
                        },
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                {
                    opcode: 'detectedHandposePositionY',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'imageProcessing.detectedHandposePositionY',
                        default: '[HANDEDNESS_PARTS] 손 모양의 [HANDPOSE_PARTS] 의 y 좌표',
                        description: '사용자의 왼손 또는 오른손 모양 부위 y 좌표'
                    }),
                    arguments: {
                        HANDEDNESS_PARTS: {
                            type: ArgumentType.STRING,
                            menu: 'handednessParts',
                            defaultValue: ImageProcessing.HandednessParts.LEFT
                        },
                        HANDPOSE_PARTS: {
                            type: ArgumentType.NUMBER,
                            menu: 'handposeParts',
                            defaultValue: ImageProcessing.HandposeParts.THUMB
                        },
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                {
                    opcode: 'detectedHandposeSize',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'imageProcessing.detectedHandposeSize',
                        default: '[HANDEDNESS_PARTS] 손 모양의 크기',
                        description: '사용자의 왼손 또는 오른손 모양 크기'
                    }),
                    arguments: {
                        HANDEDNESS_PARTS: {
                            type: ArgumentType.STRING,
                            menu: 'handednessParts',
                            defaultValue: ImageProcessing.HandednessParts.LEFT
                        },
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                '---',
                {
                    opcode: 'color',
                    blockType: BlockType.REPORTER,
                    text: '[COLOR]',
                    arguments: {
                        COLOR: {
                            type: ArgumentType.COLOR_CAMERA
                        }
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                {
                    opcode: 'detectedColorLength',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'imageProcessing.detectedColorLength',
                        default: '감지 된 [COLOR] 색의 개수',
                        description: '감지 된 색깔 영역의 수'
                    }),
                    arguments: {
                        COLOR: {
                            type: ArgumentType.COLOR_CAMERA
                        }
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                {
                    opcode: 'isColorDetected',
                    blockType: BlockType.BOOLEAN,
                    text: formatMessage({
                        id: 'imageProcessing.isColorDetected',
                        default: '[COLOR] 색이 감지되었는가?',
                        description: '색깔의 감지 여부 확인'
                    }),
                    arguments: {
                        COLOR: {
                            type: ArgumentType.COLOR_CAMERA
                        }
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                {
                    opcode: 'colorDetectionMinSize',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'imageProcessing.colorDetectionMinSize',
                        default: '색상 감지의 최소 크기를 [SIZE] 로 정하기',
                        description: '색상 감지의 최소 크기 정하기'
                    }),
                    arguments: {
                        SIZE: {
                            type: ArgumentType.POSITIVE_NUMBER,
                            defaultValue: 30
                        }
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                '---',
                {
                    func: 'MODIFY_CLASSIFIER',
                    blockType: BlockType.BUTTON,
                    text: formatMessage({
                        id: 'imageProcessing.modifyClassifier',
                        default: '분류 기준 정하기',
                        description: '분류기의 항목값을 수정하는 modal창 띄우기'
                    })
                },
                '---',
                {
                    opcode: 'classifierResult',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'imageProcessing.classifierResult',
                        default: '분류 결과',
                        description: '색상 감지의 최소 크기 정하기'
                    }),
                    arguments: {},
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                {
                    opcode: 'classifierReliability',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'imageProcessing.classifierReliability',
                        default: '현재 [CLASS_NAME]와 일치율',
                        description: '특정 항목의 일치율 값을 가져오기'
                    }),
                    arguments: {
                        CLASS_NAME: {
                            type: ArgumentType.STRING,
                            menu: 'className',
                            defaultValue: this.getFirstClassifierName()
                        }
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                },
                {
                    opcode: 'isClassifierResult',
                    blockType: BlockType.BOOLEAN,
                    text: formatMessage({
                        id: 'imageProcessing.isClassifierResult',
                        default: '분류 결과가 [CLASS_NAME]인가?',
                        description: '특정 항목의 일치율이 50% 이상인지 가져오기'
                    }),
                    arguments: {
                        CLASS_NAME: {
                            type: ArgumentType.STRING,
                            menu: 'className',
                            defaultValue: this.getFirstClassifierName()
                        }
                    },
                    color: Colours.sensing.primary,
                    colorSecondary: Colours.sensing.secondary,
                    colorTertiary: Colours.sensing.tertiary
                }
            ],
            menus: {
                cameraType: {
                    acceptReporters: false,
                    items: this._buildMenu(this.CAMERA_TYPE),
                },
                detectionFullType: {
                    acceptReporters: false,
                    items: this._buildMenu(this.DETECTION_TYPE.concat(this.DETECTION_ADD_ON)),
                },
                detectionType: {
                    acceptReporters: false,
                    items: this._buildMenu(this.DETECTION_TYPE),
                },
                detectionState: {
                    acceptReporters: false,
                    items: this._buildMenu(this.DETECTION_STATE),
                },
                userName: {
                    acceptReporters: false,
                    items: this._buildMenu(this.USER_NAME),
                },
                faceParts: {
                    acceptReporters: false,
                    items: this._buildMenu(this.FACE_PARTS),
                },
                className: {
                    acceptReporters: false,
                    items: this._buildMenu(this.CLASS_NAME)
                },
                /**
                 * 추가 : hand-pose-detection 
                 * */ 
                handedness: {
                    acceptReporters: false,
                    items: this._buildMenu(this.HANDEDNESS),
                },
                handednessParts: {
                    acceptReporters: false,
                    items: this._buildMenu(this.HANDEDNESS_PARTS),
                },
                handposeParts: {
                    acceptReporters: false,
                    items: this._buildMenu(this.HANDPOSE_PARTS),
                },
            }
        };
    }

    cameraToggle (args) {
        if (this.camera) this.camera.detectorOff();
        if (args.CAMERA_TYPE === CameraType.CAMERAMODULE)
            this.camera = this._runtime.ioDevices.cameraModule;
        else
            this.camera = this._runtime.ioDevices.video;
        this.camera.detectorOn();
    }

    /**
     * 감기 기능 활성화/비활성화 함수
     * 라이브러리 마다 감지를 시작하기까지의 시간이 필요하므로, 1프레임(30fps) 정도 시간을 지연함.
     * @param {any} args
     */
    detectionToggle (args) {
        this.cameraChecker();
        let manager = this.detectorManager;
        if (args.DETECTION_TYPE == DetectionType.IMAGE_CLASSIFIER) manager = this.classifierManager;
        manager.setEnable(args.DETECTION_TYPE, (args.DETECTION_STATE == CameraBlocks.State.ON));
        return new Promise(resolve => setTimeout(() => resolve(), Runtime.THREAD_STEP_INTERVAL_COMPATIBILITY));
    }

    drawBoxToggle (args) {
        this.detectorManager.setDrawable(
            args.DETECTION_TYPE,
            (args.DETECTION_STATE == CameraBlocks.State.ON),
            this.camera._ghost
        );
    }

    isMarkerDetected (args) {
        if (this._isNoneDetectedMarkers()) {
            return false;
        }

        const id = Cast.toNumber(args.MARKER_ID);
        return this._targetMarker(id) ? true : false;
    }

    /**
     * @param {any} args
     */
    detectedMarkers (args) {
        let ids = '';
        if (this._isNoneDetectedMarkers()) {
            return ids;
        }

        const markers = this.detectorManager.detectedResult(DetectionType.MARKER);
        const detectedIds = [];
        for (let i = 0; i < markers.length; i++) {
            const id = markers[i].id;
            if (detectedIds.indexOf(id) < 0) {
                detectedIds.push(id);
            }
        }

        if (detectedIds.length > 0) {
            ids = detectedIds.join(' ');
        }
        return ids;
    }

    detectedMarkerSize (args) {
        let size = 0;
        if (this._isNoneDetectedMarkers()) {
            return size;
        }
        const id = Cast.toNumber(args.MARKER_ID);
        const marker = this._targetMarker(id);
        if (marker) {
            var disX = marker.corners[0].x - marker.corners[1].x;
            var dixY = marker.corners[0].y - marker.corners[1].y;
            size = Math.sqrt(Math.abs(disX * disX) + Math.abs(dixY * dixY));
            if (size < 0) size *= -1;
        }
        return size;
    }

    detectedMarkerPositionX (args) {
        let posX = 0;
        if (this._isNoneDetectedMarkers()) {
            return posX;
        }
        const id = Cast.toNumber(args.MARKER_ID);
        const marker = this._targetMarker(id);
        if (marker) {
            posX = (marker.corners[0].x + marker.corners[2].x) * 0.5 - (Camera.DIMENSIONS[0] * 0.5);
        }
        return posX;
    }

    detectedMarkerPositionY (args) {
        let posY = 0;
        if (this._isNoneDetectedMarkers()) {
            return posY;
        }

        const id = Cast.toNumber(args.MARKER_ID);
        const marker = this._targetMarker(id);

        if (marker) {
            posY = (Camera.DIMENSIONS[1] * 0.5) - (marker.corners[0].y + marker.corners[2].y) * 0.5;
        }
        return posY;
    }

    detectedMarkerDirection (args) {
        let dir = 0;
        if (this._isNoneDetectedMarkers()) {
            return dir;
        }

        const id = Cast.toNumber(args.MARKER_ID);
        const marker = this._targetMarker(id);
        if (marker) {
            const centerX = (marker.corners[0].x + marker.corners[2].x) * 0.5;
            const centerY = (marker.corners[0].y + marker.corners[2].y) * 0.5;

            const rad = Math.atan2(centerY - marker.corners[0].y, centerX - marker.corners[0].x);
            dir = (rad * 180) / Math.PI;
            dir -= 45;
            if (dir < -180) dir += 360;
        }
        return dir;
    }

    _targetMarker (id) {
        if (this._isNoneDetectedMarkers() || id < 0 || id > 1024) {
            return;
        }

        const markers = this.detectorManager.detectedResult(DetectionType.MARKER);
        for (let i = 0; i < markers.length; i++) {
            if (markers[i].id == id) {
                return markers[i];
            }
        }
        return;
    }

    _isNoneDetectedMarkers () {
        const markers = this.detectorManager.detectedResult(DetectionType.MARKER);
        return !markers || markers.length <= 0;
    }

    isQRCodeDetected (args) {
        return this.detectorManager.detectedResult(DetectionType.QRCODE) ? true : false;
    }

    detectedQRCodeValue (args) {
        const qr = this.detectorManager.detectedResult(DetectionType.QRCODE);
        return qr ? qr.data : '';
    }

    detectedFaceLength (args) {
        const faces = this.detectorManager.detectedResult(DetectionType.FACE);
        return faces ? faces.length : 0;
    }

    isFaceDetected (args) {
        const faces = this.detectorManager.detectedResult(DetectionType.FACE);
        if (!faces) return false;

        const id = args.USER_NAME;

        if (id === 'any') {
            return (faces.length > 0);
        } else {
            for (let i = 0; i < faces.length; i++) {
                if (faces[i].id === id) {
                    return true;
                }
            }
        }
        return false;
    }

    detectedFacePositionX (args) {
        return this._targetFacePartsPosition(args.USER_NAME, args.FACE_PARTS).x;
    }

    detectedFacePositionY (args) {
        return this._targetFacePartsPosition(args.USER_NAME, args.FACE_PARTS).y;
    }

    detectedFaceSize (args) {
        const face = this._targetFace(args.USER_NAME);
        if (!face) return 0;

        const jaw1 = face.detection.landmarks.getJawOutline()[0];
        const jaw2 = face.detection.landmarks.getJawOutline()[16];

        const disX = jaw1.x - jaw2.x;
        const disY = jaw1.y - jaw2.y;

        return Math.sqrt(Math.abs(disX * disX) + Math.abs(disY * disY));
    }

    _targetFacePartsPosition (id, type) {
        const face = this._targetFace(id);
        const ret = {x: 0, y: 0};
        if (!face) return ret;

        const landmark = face.detection.landmarks;
        let partPoint = null;
        switch (type) {
            case 'leftEye': {
                const sum = landmark.getLeftEye()[0].add(landmark.getLeftEye()[3]);
                partPoint = {x: sum.x * 0.5, y: sum.y * 0.5};
            } break;
            case 'rightEye': {
                const sum = landmark.getRightEye()[0].add(landmark.getRightEye()[3]);
                partPoint = {x: sum.x * 0.5, y: sum.y * 0.5};
            } break;
            case 'leftEyeBrow':
                partPoint = landmark.getLeftEyeBrow()[2];
                break;
            case 'rightEyeBrow':
                partPoint = landmark.getRightEyeBrow()[2];
                break;
            case 'nose':
                partPoint = landmark.getNose()[3];
                break;
            case 'mouth':
                const sum = landmark.getMouth()[14].add(landmark.getMouth()[18]);
                partPoint = {x: sum.x * 0.5, y: sum.y * 0.5};
                break;
            case 'jaw':
                partPoint = landmark.getJawOutline()[8];
                break;
        }

        if (partPoint) {
            const dimensions = Camera.DIMENSIONS;
            ret.x = partPoint.x - (dimensions[0] * 0.5);
            ret.y = (dimensions[1] * 0.5) - partPoint.y;
        }
        return ret;
    }

    _targetFace (id) {
        const faces = this.detectorManager.detectedResult(DetectionType.FACE);
        if (!faces || faces.length == 0) return;

        if (id === 'any') {
            const index = Math.floor(Math.random() * (faces.length - 1));
            return faces[index];
        } else {
            for (let i = 0; i < faces.length; i++) {
                if (id === faces[i].id) {
                    return faces[i];
                }
            }
        }
    }

    /**
     * 추가 : hand-pose-detection 블럭 함수들 
     */
    isHandposeDetected(args) {
        const handposes = this.detectorManager.detectedResult(DetectionType.HANDPOSE);
        if (!handposes) return false;
        // 왼손 또는 오른손 || 양손
        return handposes.some(result => result.handedness === args.HANDEDNESS || (args.HANDEDNESS === 'Both' && handposes.length === 2));
    }

    detectedHandposePositionX(args) {
        return this._targetHandposePartsPosition(args.HANDEDNESS_PARTS, args.HANDPOSE_PARTS).x;
    }

    detectedHandposePositionY(args) {
        return this._targetHandposePartsPosition(args.HANDEDNESS_PARTS, args.HANDPOSE_PARTS).y;
    }

    detectedHandposeSize(args) {
        const handpose = this._targetHandpose(args.HANDEDNESS_PARTS);  
        if (!handpose) return 0;

        // wrist, thumb_tip, middle_finger_tip, pinky_finger_tip
        const [keypoint0, keypoint1, keypoint2, keypoint3] = handpose.filter((_, index) => [0, 4, 12, 20].includes(index));
        const width = Math.hypot(keypoint3.x - keypoint1.x, keypoint3.y - keypoint1.y);
        const height = Math.hypot(keypoint2.x - keypoint0.x, keypoint2.y - keypoint0.y);
        
        return (width + height) / 2;
    }

    _targetHandposePartsPosition(handedness, type) {
        const handpose = this._targetHandpose(handedness);
        const ret = { x: 0, y: 0 };
        if (!handpose) return ret;

        const isPalm = type === 'palm';
        const targetKeypoints = isPalm ? handpose.filter((_, index) => [0, 9].includes(index)) : handpose.filter(keypoint => keypoint.name.startsWith(type));
        console.log('targetKeypoints', targetKeypoints);
        const partPoint = this._getPartPoint(targetKeypoints);
        console.log('partPoint', partPoint);

        if (partPoint) {
            const dimensions = Camera.DIMENSIONS;
            ret.x = partPoint.x / partPoint.count - (dimensions[0] * 0.5);
            ret.y = partPoint.y / partPoint.count - (dimensions[1] * 0.5);
        }
        return ret;
    }

    _targetHandpose (handedness) {
        const handposes = this.detectorManager.detectedResult(DetectionType.HANDPOSE);
        const keypoints = handposes && handposes.find(result => result.handedness === handedness);
        console.log('keypoints: ', keypoints);
        return keypoints ? keypoints.keypoints : null;
    } 

    _getPartPoint(keypoints) {
        if (keypoints) {
            const initialPartPoint = { x: 0, y: 0, count: 0 };
            return keypoints.reduce((acc, {x, y}) => ({ x: acc.x + x, y: acc.y + y, count: acc.count + 1}), initialPartPoint);
        }
    }

    color (args) {
        return args.COLOR;
    }

    isColorDetected (args) {
        const htmlColor = args.COLOR;
        ColorDetector.add(htmlColor);
        return this._targetColorDetectedLength(htmlColor) > 0;
    }

    detectedColorLength (args) {
        const htmlColor = args.COLOR;
        ColorDetector.add(htmlColor);
        return this._targetColorDetectedLength(htmlColor);
    }

    colorDetectionMinSize (args) {
        ColorDetector.setMinDimension(args.SIZE);
    }

    classifierResult (args) {
        const classifier = this.classifierManager.results;
        for (let i = 0; i < classifier.length; i++) {
            if (classifier[i].rate > 50) return classifier[i].name;
        }
        return null;
    }

    classifierReliability (args) {
        const index = this.getClassifierResultIndexByName(args.CLASS_NAME);
        if (index < 0) return 0;
        const classifier = this.classifierManager.results;

        return classifier[index].rate;
    }

    isClassifierResult (args) {
        const index = this.getClassifierResultIndexByName(args.CLASS_NAME);
        if (index < 0) return false;
        const classifier = this.classifierManager.results;

        return classifier[index].rate > 50;
    }

    _targetColorDetectedLength (color) {
        const result = this.detectorManager.detectedResult(DetectionType.COLOR);
        let count = 0;
        if (!result) return count;

        for (const [key, value] of Object.entries(result)) {
            if (value.hasOwnProperty('color') && value.color == color) {
                count++;
            }
        }

        return count;
    }

    cameraChecker () {
        const io = this._runtime.ioDevices
        if (!this.camera || !this.camera.isReady || !this.camera._isDetecting) {
            if (io.cameraModule.isReady) this.cameraToggle({CAMERA_TYPE: CameraType.CAMERAMODULE});
            else if (io.video.isReady) this.cameraToggle({CAMERA_TYPE: CameraType.WEBCAM});
            else this.cameraToggle({CAMERA_TYPE: CameraType.WEBCAM});
        }
    }

    getClassifierResultIndexByName (name) {
        const classifier = this.classifierManager.results;
        if (classifier && classifier.length > 0) {
            for (let i = 0; i < classifier.length; i++) {
                if (classifier[i].name === name) return i;
            }
        }
        return -1;
    }

    getFirstClassifierName () {
        const classifier = this.classifierManager.results;
        if (classifier && classifier.length > 0) {
            for (let i = 0; i < classifier.length; i++) {
                if (classifier[i].name !== null) return classifier[i].name;
            }
        }
        return '';
    }
}

module.exports = ImageProcessing;
