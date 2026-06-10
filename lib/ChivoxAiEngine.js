"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * 版本号
 *
 * 31 ~ 24 : MAJOR
 * 23 ~ 16 : MINOR
 * 15 ~  8 : PATCH
 * 7  ~  0 : 保持为00, 不要填写任何数字 
 *
 */
var ChivoxSdkVersion = 0x02000800;

var ChivoxAiErr = {
    EngineStatus: 72201,
    NotYetNew: 72202,
    NotYetStart: 72203,
    NewRepeatedly: 72204,
    StartRepeatedly: 72205,
    StopRepeatedly: 72206,
    WaitConnectFinish: 72207, // TODO remove
    WaitStartFinish: 72208,
    WaitStopFinish: 72209,
    WaitResulted: 72210,
    WaitCancelFinish: 72211,
    StartRecorderFail: 72212,
    StopRecorderFail: 72213,
    CancelRecorderFail: 72214,
    WxRecorderError: 72215,
    OperationCanceled: 72216
};

var ChivoxWsErr = {
    WechatVersion: 72001,
    InvalidApp: 72002,
    InvalidAppAppId: 72003,
    InvalidAppSig: 72004,
    InvalidAppAlg: 72005,
    InvalidAppUserId: 72006,
    InvalidRequest: 72007,
    InvalidAudio: 72008,
    InvalidAudioType: 72009,
    InvalidAudioChannel: 72010,
    InvalidSampleBytes: 72011,
    InvalidSampleRate: 72012,
    EngineStatus: 72013,
    ConnectRepeatedly: 72014, // TODO remove
    ConnectFail: 72015,
    StartRepeatedly: 72016,
    StopRepeatedly: 72017,
    NotYetConnect: 72018,
    NotYetStarted: 72019,
    WaitConnected: 72020,
    WaitResulted: 72021,
    ResultJsonParse: 72022,
    ResultNotObject: 72023,
    NetException: 72024,
    ServerTimeout: 72025
};

var ChivoxUtils = {
    generateGuid: function generateGuid() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            var v = c === "x" ? r : r & 0x3 | 0x8;
            return v.toString(16);
        });
    },
    getVersion: function getVersion(_version) {
        var tkn = (_version & 0xff000000) >> 24;
        var ver = "";
        ver += tkn.toString();
        tkn = (_version & 0x00ff0000) >> 16;
        ver += "." + tkn.toString();
        tkn = (_version & 0x0000ff00) >> 8;
        ver += "." + tkn.toString();
        tkn = _version & 0x000000ff;
        if (tkn !== 0) {
            ver += "." + tkn.toString();
        }
        return ver;
    },
    compareWxVersion: function compareWxVersion(v1, v2) {
        v1 = v1.split('.');
        v2 = v2.split('.');
        var len = Math.max(v1.length, v2.length);

        while (v1.length < len) {
            v1.push('0');
        }
        while (v2.length < len) {
            v2.push('0');
        }

        for (var i = 0; i < len; i++) {
            var num1 = parseInt(v1[i]);
            var num2 = parseInt(v2[i]);

            if (num1 > num2) {
                return 1;
            } else if (num1 < num2) {
                return -1;
            }
        }
        return 0;
    },
    isValidApp: function isValidApp(app, err, tag) {
        if (typeof tag !== "string") tag = "";
        if (typeof app === "undefined") {
            err.errId = ChivoxWsErr.InvalidApp;
            err.error = tag + " no 'app'. ";
            return false;
        }
        if ((typeof app === "undefined" ? "undefined" : _typeof(app)) !== "object") {
            err.errId = ChivoxWsErr.InvalidApp;
            err.error = tag + " invalid 'app'. ";
            return false;
        }
        if (typeof app.applicationId !== "string") {
            err.errId = ChivoxWsErr.InvalidAppAppId;
            err.error = tag + " invalid 'app.applicationId'. ";
            return false;
        }
        if (typeof app.sig !== "string") {
            err.errId = ChivoxWsErr.InvalidAppSig;
            err.error = tag + " invalid 'app.sig'. ";
            return;
        }
        if (typeof app.alg !== "string") {
            err.errId = ChivoxWsErr.InvalidAppAlg;
            err.error = tag + " invalid 'app.alg'. ";
            return false;
        }
        if (typeof app.userId !== "string") {
            err.errId = ChivoxWsErr.InvalidAppUserId;
            err.error = tag + " invalid 'app.userId'. ";
            return false;
        }
        return true;
    },
    isValidRequest: function isValidRequest(request, err, tag) {
        if (typeof tag !== "string") tag = "";
        if ((typeof request === "undefined" ? "undefined" : _typeof(request)) !== "object") {
            err.errId = ChivoxWsErr.InvalidRequest;
            err.error = tag + " invalid 'request'. ";
            return false;
        }
        return true;
    },
    isValidAudio: function isValidAudio(audio, err) {
        if ((typeof audio === "undefined" ? "undefined" : _typeof(audio)) !== "object") {
            err.errId = ChivoxWsErr.InvalidAudio;
            err.error = "[ChivoxWsEngine] invalid 'audio', or no 'audio'. ";
            return false;
        }
        if (typeof audio.audioType !== "string") {
            err.errId = ChivoxWsErr.InvalidAudioType;
            err.error = "[ChivoxWsEngine] invalid audio.audioType. ";
            return false;
        }
        if (audio.channel !== 1) {
            err.errId = ChivoxWsErr.InvalidAudioChannel;
            err.error = "[ChivoxWsEngine] invalid audio.channel. ";
            return false;
        }
        if (typeof audio.sampleBytes !== "number") {
            err.errId = ChivoxWsErr.InvalidSampleBytes;
            err.error = "[ChivoxWsEngine] invalid audio.sampleBytes. ";
            return false;
        }
        if (typeof audio.sampleRate !== "number") {
            err.errId = ChivoxWsErr.InvalidSampleRate;
            err.error = "[ChivoxWsEngine] invalid audio.sampleRate. ";
            return false;
        }
        return true;
    }
};

var ChivoxFire = {
    Fail: function Fail(options, res, res2) {
        if (typeof options.fail === "function") {
            options.fail(res);
        } else {
            console.warn("'fail' undefined");
        }
        if (typeof options.complete === "function") {
            options.complete(res2);
        }
    },
    Success: function Success(options, res, res2) {
        if (typeof options.success === "function") {
            options.success(res);
        } else {
            console.warn("'success' undefined");
        }
        if (typeof options.complete === "function") {
            options.complete(res2);
        }
    },
    OnResult: function OnResult(obj, res) {
        if (typeof obj._onResult === "function") {
            obj._onResult(res);
        } else {
            console.warn("'onResult' undefined");
        }
    },
    OnErrorResult: function OnErrorResult(obj, res) {
        if (typeof obj._onErrorResult === "function") {
            obj._onErrorResult(res);
        } else {
            console.warn("'onErrorResult' undefined");
        }
    },


    // for ChivoxAiEngine

    OnRecorderStart: function OnRecorderStart(obj, res) {
        if (typeof obj._onRecorderStart === "function") {
            obj._onRecorderStart(res);
        } else {
            console.warn("'onRecorderStart' undefined");
        }
    },
    OnRecorderPause: function OnRecorderPause(obj, res) {
        if (typeof obj._onRecorderPause === "function") {
            obj._onRecorderPause(res);
        } else {
            console.warn("'onRecorderPause' undefined");
        }
    },
    OnRecorderResume: function OnRecorderResume(obj, res) {
        if (typeof obj._onRecorderResume === "function") {
            obj._onRecorderResume(res);
        } else {
            console.warn("'onRecorderResume' undefined");
        }
    },
    OnRecorderStop: function OnRecorderStop(obj, res) {
        if (typeof obj._onRecorderStop === "function") {
            obj._onRecorderStop(res);
        } else {
            console.warn("'onRecorderStop' undefined");
        }
    },
    OnRecorderError: function OnRecorderError(obj, res) {
        if (typeof obj._onRecorderError === "function") {
            obj._onRecorderError(res);
        }
    },
    OnRecorderFrame: function OnRecorderFrame(obj, res) {
        if (typeof obj._onRecorderFrame === "function") {
            obj._onRecorderFrame(res);
        }
    }
};

var ChivoxWsLogBus = {
    WsConnectStart: 19,
    WsConnectSuccess: 15,
    WsConnectClose: 17,
    WsConnectFail: 16,
    GetResultSuccess: 1000,
    GetResultTimeOut: 1001
};

/*
    状态转换图：
                None <-------+ <--+ <--+ <--+ <--+ 
                  ↓          |    |    |    |    |
                Connecting --+    |    |    |    |
                  ↓               |    |    |    |
                Ready ------------+    |    |    |
                  ↓                    |    |    |
       +------> Evaluating ------------+    |    |
       |          ↓                         |    |
       |        Resulting ------------------+    |
       |          ↓                              |
       |        Resulted ------------------------+
       |          ↓
       +----------+
 */

var ChivoxWsEngineStatus = {
    None: "None",
    Connecting: "Connecting",
    Ready: "Ready",
    Evaluating: "Evaluating",
    Resulting: "Resulting",
    Resulted: "Resulted"
};

var ChivoxWsEngineReStatus = {
    completed: "completed",
    reConnecting: "reConnecting",
    reConnected: "reConnected"
};

var ChivoxWsEngine = function () {
    function ChivoxWsEngine() {
        _classCallCheck(this, ChivoxWsEngine);

        var that = this;
        that._version = ChivoxSdkVersion;
        that._SERVER_DEFAULT = "wss://cloud.chivox.com/ws?e=0&t=0&version=2";
        that._SERVER_GRAY = "wss://gray.cloud.chivox.com/ws?e=0&t=0&version=2";
        that._server = that._SERVER_DEFAULT;

        that._wsClient = undefined;
        that._waitTimer = undefined;
        that._lastConnectOptions = undefined;
        that._lastStartOptions = undefined;
        that._status = ChivoxWsEngineStatus.None;
        that._reConnecting = undefined;
        that._onErrorResult = undefined;
        that._onResult = undefined;
    }

    _createClass(ChivoxWsEngine, [{
        key: "onResult",
        value: function onResult(func) {
            this._onResult = func;
        }
    }, {
        key: "onErrorResult",
        value: function onErrorResult(func) {
            this._onErrorResult = func;
        }
    }, {
        key: "getVersion",
        value: function getVersion() {
            return ChivoxUtils.getVersion(this._version);
        }

        /**
         * init 初始化
         * @param {boolean} gray [可选] 是否使用灰度服
         * @param {string} server [可选-非公开] 指定服务器，若传此参数，则忽略gray
         */

    }, {
        key: "init",
        value: function init(cfg) {
            var that = this;
            console.log("[ChivoxWsEngine] init()");

            that.reset();
            if ((typeof cfg === "undefined" ? "undefined" : _typeof(cfg)) === "object") {
                if (cfg.gray) {
                    that._server = that._SERVER_GRAY;
                }
                if (typeof cfg.server === "string") {
                    that._server = cfg.server + "/ws?e=0&t=0&version=2";
                }
            }
        }

        /**
         * start 向评分服务发送"开始"命令
         * [1] 如果引擎内部还没有连接评分服务器，本方内部会先连接，然后后再发送"开始"命令。
         * [2] 如果引擎内部已经连接到评分服务器了，本方法直接发送"开始"命令。
         * [3] 如果引擎内部的服务器连接断开了，同 [1]
         * @param {object} app [必选] 身份验证信息。连接服务器时用到，如果已经连接上了，则不再连接。
         * @param {string} tokenId [可选-非公开] 指定tokenId
         * @param {object} request [必选] 评分请求
         * @param {object} audio [必选] 音频参数
         * @param {function} success [必选] 接口调用成功事件
         * @param {function} fail [必选] 接口调用失败事件
         * @param {function} complete [可选] 接口调用完毕事件 
         */

    }, {
        key: "start",
        value: function start(options) {
            var that = this;
            console.log("[ChivoxWsEngine] start()");

            if (that._status != ChivoxWsEngineStatus.None && that._status != ChivoxWsEngineStatus.Ready && that._status != ChivoxWsEngineStatus.Resulted) {

                if (that._status == ChivoxWsEngineStatus.Connecting) {
                    var _err = { errId: ChivoxWsErr.WaitConnected,
                        error: "[ChivoxWsEngine] engine is connecting to server, please wait connected. "
                    };
                    ChivoxFire.Fail(options, _err);
                    return;
                }

                if (that._status == ChivoxWsEngineStatus.Evaluating) {
                    var _err2 = { errId: ChivoxWsErr.StartRepeatedly,
                        error: "[ChivoxWsEngine] you shouldn't call 'start' repeatedly. "
                    };
                    ChivoxFire.Fail(options, _err2);
                    return;
                }

                if (that._status == ChivoxWsEngineStatus.Resulting) {
                    var _err3 = { errId: ChivoxWsErr.WaitResulted,
                        error: "[ChivoxWsEngine] you should wait the 'result'. "
                    };
                    ChivoxFire.Fail(options, _err3);
                    return;
                }

                // 逻辑上不可能到这里

                var err = { errId: ChivoxWsErr.EngineStatus,
                    error: "[ChivoxWsEngine] engine status error when you call 'start', status: " + that._status + ". "
                };
                ChivoxFire.Fail(options, err);
                return;
            }
            options.tcpNoDelay = typeof options.tcpNoDelay === "boolean" ? options.tcpNoDelay : true;
            that._lastStartOptions = options;
            if (that._status == ChivoxWsEngineStatus.None) {
                that._reConnecting = ChivoxWsEngineReStatus.completed;
                that._doConnect({
                    app: options.app,
                    tcpNoDelay: options.tcpNoDelay,
                    success: function success() {
                        that._doStart(options);
                    },
                    fail: function fail(res) {
                        ChivoxFire.Fail(options, res);
                    }
                });
                return;
            }

            that._doStart(options);
        }
    }, {
        key: "isStarted",
        value: function isStarted() {
            var that = this;
            return that._status == ChivoxWsEngineStatus.Evaluating;
        }
    }, {
        key: "_doConnect",
        value: function _doConnect(options) {
            var that = this;
            var sysInfo = wx.getSystemInfoSync();

            that._status = ChivoxWsEngineStatus.Connecting;

            if (ChivoxUtils.compareWxVersion(sysInfo.SDKVersion, "1.7.0") < 0) {
                that._status = ChivoxWsEngineStatus.None;
                var _err4 = { errId: ChivoxWsErr.WechatVersion,
                    error: "[ChivoxWsEngine] the minimum version requirement of wechat-app-sdk is 1.7.0 . "
                };
                ChivoxFire.Fail(options, _err4);
                return;
            }

            var err = {};
            if (!ChivoxUtils.isValidApp(options.app, err, "[ChivoxWsEngine]")) {
                that._status = ChivoxWsEngineStatus.None;
                ChivoxFire.Fail(options, err);
                return;
            }

            that._wsClient = wx.connectSocket({
                url: that._server,
                tcpNoDelay: options.tcpNoDelay,
                success: function success(res) {
                    that._logBus({ est: ChivoxWsLogBus.WsConnectStart, reason: res.errMsg });
                },
                fail: function fail(res) {
                    that._status = ChivoxWsEngineStatus.None;
                    var err = { errId: ChivoxWsErr.ConnectFail,
                        error: "[ChivoxWsEngine] connect server(" + that._server + ") fail. " + res.errMsg + ". "
                    };
                    that.reset();
                    ChivoxFire.Fail(options, err);
                }
            });

            if (typeof that._wsClient !== "undefined") {
                that._lastConnectOptions = options;
                that._wsClient.onOpen(that._onWsOpen(that._wsClient));
                that._wsClient.onMessage(that._onWsMessage(that._wsClient));
                that._wsClient.onError(that._onWsError(that._wsClient));
                that._wsClient.onClose(that._onWsClose(that._wsClient));
            }
        }
    }, {
        key: "_doStart",
        value: function _doStart(options) {
            var that = this;

            var oldStatus = that._status;
            that._status = ChivoxWsEngineStatus.Evaluating;

            var err = {};
            if (!ChivoxUtils.isValidRequest(options.request, err, "[ChivoxWsEngine]")) {
                that._status = oldStatus;
                ChivoxFire.Fail(options, err);
                return;
            }

            err = {};
            if (!ChivoxUtils.isValidAudio(options.audio, err)) {
                that._status = oldStatus;
                ChivoxFire.Fail(options, err);
                return;
            }

            var tokenId = options.tokenId;
            if (typeof tokenId !== "string") {
                tokenId = ChivoxUtils.generateGuid().replace(/-/g, "");
            }
            that._tokenId = tokenId;

            var startObj = { tokenId: tokenId, request: options.request, audio: options.audio };
            var startText = JSON.stringify(startObj);

            console.log("[ChivoxWsEngine] send start text");
            console.debug(startObj);

            that._wsClient.send({ data: startText,
                fail: function fail(res) {
                    console.warn("[ChivoxWsEngine] send start text fail!!! errMsg: " + res.errMsg);
                }
            });

            ChivoxFire.Success(options, { tokenId: tokenId });
        }

        /**
         * feed 向评分服务发送音频数据
         * @param  {ArrayBuffer} data 音频数据, 不允许传入空对象或Buffer长度为0
         * @param {function} success 接口调用成功事件
         * @param {function} fail 接口调用失败事件
         * @param {function} complete 接口调用完毕事件 
         */

    }, {
        key: "feed",
        value: function feed(options) {
            var that = this;
            console.log("[ChivoxWsEngine] feed()");

            if (that._status != ChivoxWsEngineStatus.Evaluating) {

                if (that._status == ChivoxWsEngineStatus.None) {
                    var _err5 = { errId: ChivoxWsErr.NotYetConnect,
                        error: "[ChivoxWsEngine] you should call 'start' first. "
                    };
                    ChivoxFire.Fail(options, _err5);
                    return;
                }
                if (that._status == ChivoxWsEngineStatus.Connecting) {
                    var _err6 = { errId: ChivoxWsErr.WaitConnected,
                        error: "[ChivoxWsEngine] you should wait 'start' complete. "
                    };
                    ChivoxFire.Fail(options, _err6);
                    return;
                }
                if (that._status == ChivoxWsEngineStatus.Ready) {
                    var _err7 = { errId: ChivoxWsErr.NotYetStarted,
                        error: "[ChivoxWsEngine] you should call 'start' first. "
                    };
                    ChivoxFire.Fail(options, _err7);
                    return;
                }

                // stop以后feed的数据
                if (that._status == ChivoxWsEngineStatus.Resulting || that._status == ChivoxWsEngineStatus.Resulted) {
                    console.warn("[ChivoxWsEngine] you shouldn't feed data after you called 'stop'. ");
                    ChivoxFire.Success(options);
                    return;
                }

                // 逻辑上不可能执行到这里
                var err = { errId: ChivoxWsErr.EngineStatus,
                    error: "[ChivoxWsEngine] engine status error when you call 'feed', status: " + that._status + ". "
                };
                ChivoxFire.Fail(options, err);
                return;
            }

            console.log("[ChivoxWsEngine] send audio-data");
            if (null == options.data || options.data.byteLength <= 0) {
                ChivoxFire.Success(options);
                return;
            }
            that._wsClient.send({ data: options.data,
                fail: function fail(res) {
                    console.warn("[ChivoxWsEngine] send audio-data fail!!! errMsg: " + res.errMsg);
                }
            });
            ChivoxFire.Success(options);
        }

        /**
         * stop 向评分服务发送"结束"命令
         * @param {int} timeout [可选] 等待结果超时，单位毫秒
         * @param {function} success 接口调用成功事件
         * @param {function} fail 接口调用失败事件
         * @param {function} complete 接口调用完毕事件 
         */

    }, {
        key: "stop",
        value: function stop(options) {
            var that = this;
            console.log("[ChivoxWsEngine] stop()");

            if (that._status != ChivoxWsEngineStatus.Evaluating) {

                if (that._status == ChivoxWsEngineStatus.None) {
                    var _err8 = { errId: ChivoxWsErr.NotYetConnect,
                        error: "[ChivoxWsEngine] you should call 'start' first. "
                    };
                    ChivoxFire.Fail(options, _err8);
                    return;
                }
                if (that._status == ChivoxWsEngineStatus.Connecting) {
                    var _err9 = { errId: ChivoxWsErr.WaitConnected,
                        error: "[ChivoxWsEngine] you should wait 'start' complete. "
                    };
                    ChivoxFire.Fail(options, _err9);
                    return;
                }
                if (that._status == ChivoxWsEngineStatus.Ready || that._status == ChivoxWsEngineStatus.Resulted) {
                    var _err10 = { errId: ChivoxWsErr.NotYetStarted,
                        error: "[ChivoxWsEngine] you should call 'start' first. "
                    };
                    ChivoxFire.Fail(options, _err10);
                    return;
                }

                // stop以后又调用stop
                if (that._status == ChivoxWsEngineStatus.Resulting) {
                    var _err11 = { errId: ChivoxWsErr.StopRepeatedly,
                        error: "[ChivoxWsEngine] you shouldn't call 'stop' repeatedly. "
                    };
                    ChivoxFire.Fail(options, _err11);
                    return;
                }

                // 逻辑上不可能执行到这里
                var err = { errId: ChivoxWsErr.EngineStatus,
                    error: "[ChivoxWsEngine] engine status error when you call 'stop', status: " + that._status + ". "
                };
                ChivoxFire.Fail(options, err);
                return;
            }

            console.log("[ChivoxWsEngine] send stop");
            that._status = ChivoxWsEngineStatus.Resulting;
            that._wsClient.send({ data: '{"cmd":"stop"}',
                fail: function fail(res) {
                    console.warn("[ChivoxWsEngine] send stop fail!!! errMsg: " + res.errMsg);
                }
            });

            var timeout = 60000; // 缺省等待时间60秒
            if (typeof options.timeout === "number" && options.timeout >= 0) {
                timeout = options.timeout;
            }
            if (typeof that._waitTimer !== "undefined") {
                clearTimeout(that._waitTimer);
                that._waitTimer = undefined;
            }
            that._waitTimer = setTimeout(that._onWaitResultTimeout(), timeout);
            ChivoxFire.Success(options);
        }

        /**
         * reset 重置引擎
         * 将会销毁websocket连接，销毁'结果定时器'
         */

    }, {
        key: "reset",
        value: function reset() {
            var that = this;
            console.log("[ChivoxWsEngine] reset()");

            if (typeof that._wsClient !== "undefined") {
                var wsClient = that._wsClient;
                that._wsClient = undefined;

                // 若正在连接的时候关闭，则连接可被正常关闭，之后_onWsOpen不再触发，onError、onClose事件会触发。
                wsClient.close();
            }
            if (typeof that._waitTimer !== "undefined") {
                var waitTimer = that._waitTimer;
                that._waitTimer = undefined;
                clearTimeout(waitTimer);
            }
            that._status = ChivoxWsEngineStatus.None;
            that._lastConnectOptions = undefined;
            that._tokenId = undefined;
        }
    }, {
        key: "_onWsOpen",
        value: function _onWsOpen(wsClient) {
            var that = this;

            return function (res) {
                console.log("[ChivoxWsEngine] _onWsOpen(), at status: " + that._status);
                if (that._wsClient !== wsClient) {
                    // 若引擎已被重置，则忽略本事件。
                    console.log("[ChivoxWsEngine] _onWsOpen: engine has been reset. not current wsClient's event.");
                    return;
                }

                if (that._reConnecting === ChivoxWsEngineReStatus.reConnecting) {
                    that._reConnecting = ChivoxWsEngineReStatus.reConnected;
                }
                that._logBus({ est: ChivoxWsLogBus.WsConnectSuccess, reason: res.errMsg });

                var lastConnectOptions = that._lastConnectOptions;
                that._lastConnectOptions = undefined;

                var app = undefined;
                if (typeof lastConnectOptions !== "undefined") {
                    app = lastConnectOptions.app;
                }

                var connectObj = {
                    sdk: { version: that._version, source: 0x09, protocol: 0x1 },
                    app: app };
                var connectText = JSON.stringify(connectObj);

                console.log("[ChivoxWsEngine] send connect text");
                console.log(connectObj);

                that._wsClient.send({ data: connectText,
                    fail: function fail(res) {
                        console.warn("[ChivoxWsEngine] send connect text fail!!! errMsg: " + res.errMsg);
                    }
                });

                that._status = ChivoxWsEngineStatus.Ready;
                if (typeof lastConnectOptions !== "undefined") {
                    ChivoxFire.Success(lastConnectOptions);
                } else {
                    console.error("[ChivoxWsEngine] _onWsOpen: lastConnectOptions undefined");
                }
            };
        }
    }, {
        key: "_onWsMessage",
        value: function _onWsMessage(wsClient) {
            var that = this;

            return function (res) {
                console.log("[ChivoxWsEngine] _onWsMessage(), at status: " + that._status);

                if (that._wsClient !== wsClient) {
                    // 若引擎已被重置，则忽略本事件。
                    console.log("[ChivoxWsEngine] _onWsMessage: engine has been reset. not current wsClient's event.");
                    return;
                }

                var result = undefined;
                if ((typeof res === "undefined" ? "undefined" : _typeof(res)) === "object") {
                    result = res.data;
                }
                if (typeof result !== "string" || result == "") {
                    console.warn("[ChivoxWsEngine] _onWsMessage: server response empty result");
                    return;
                }

                if (that._status == ChivoxWsEngineStatus.Ready) {
                    console.warn("[ChivoxWsEngine] _onWsMessage: recv websocket response at Ready status, just ignore it. ");
                    return;
                }

                if (that._status == ChivoxWsEngineStatus.Resulted) {
                    console.warn("[ChivoxWsEngine] _onWsMessage: recv websocket response at Resulted status, just ignore it. ");
                    return;
                }

                if (that._status != ChivoxWsEngineStatus.Evaluating && that._status != ChivoxWsEngineStatus.Resulting) {
                    console.error("[ChivoxWsEngine] _onWsMessage: status error, status = " + that._status);
                    return;
                }

                var needReset = false;

                try {
                    result = JSON.parse(result);
                } catch (e) {
                    needReset = true;
                    result = {
                        errId: ChivoxWsErr.ResultJsonParse,
                        error: "[ChivoxWsEngine] the server response invalid json. ",
                        tokenId: that._tokenId
                    };
                }

                if ((typeof result === "undefined" ? "undefined" : _typeof(result)) !== "object") {
                    needReset = true;
                    result = {
                        errId: ChivoxWsErr.ResultNotObject,
                        error: "[ChivoxWsEngine] the server response is not json. ",
                        tokenId: that._tokenId
                    };
                }

                console.debug("[ChivoxWsEngine] result = " + JSON.stringify(result));

                // 以上的错误情况，定会把result.tokenId置为当前tokenId

                if (result.tokenId !== undefined && result.tokenId !== null) {
                    if (result.tokenId !== that._tokenId) {
                        // tokenId非当前请求的
                        console.warn("[ChivoxWsEngine] _onWsMessage: tokenId (" + result.tokenId + ") not matched to " + that._tokenId);
                        return;
                    }
                }

                if (_typeof(result.error) === "object") {
                    var errMsg = result.error.msg;
                    result.errId = result.error.id;
                    result.error = errMsg;
                    if (result.tokenId === undefined || result.tokenId === null) {
                        result.tokenId = that._tokenId;
                    }

                    needReset = true;
                }

                if (typeof result.errId === "number" && result.errId !== 0 || result.eof == 1) {

                    that._status = ChivoxWsEngineStatus.Resulted;
                    if (typeof that._waitTimer !== "undefined") {
                        clearTimeout(that._waitTimer);
                        that._waitTimer = undefined;
                    }

                    // 在收到最终结果后，强制关闭当前连接。即，每次评分都重新连接
                    needReset = true;
                }

                if (needReset) that.reset();
                that._logBus({ est: ChivoxWsLogBus.GetResultSuccess, reason: result.eof });
                if (typeof result.errId === "number" && result.errId !== 0) {
                    ChivoxFire.OnErrorResult(that, result);
                } else {
                    ChivoxFire.OnResult(that, result);
                }
            };
        }
    }, {
        key: "_onWsError",
        value: function _onWsError(wsClient) {
            var that = this;

            return function (res) {
                console.log("[ChivoxWsEngine] _onWsError(), at status: " + that._status + ", res: " + JSON.stringify(res));
                if (that._wsClient !== wsClient) {
                    console.log("[ChivoxWsEngine] _onWsError: engine has been reset. not current wsClient's event.");
                    return;
                }

                var status = that._status;
                if (status == ChivoxWsEngineStatus.None) {
                    // 逻辑上不可能出现这种情况
                    console.error("[ChivoxWsEngine] _onWsError: code logic error, status: " + that._status);
                    that.reset();
                    return;
                }

                if (status == ChivoxWsEngineStatus.Connecting) {
                    var lastConnectOptions = that._lastConnectOptions;

                    if (that._reConnecting === ChivoxWsEngineReStatus.completed) {
                        that._reConnecting = ChivoxWsEngineReStatus.reConnecting;
                        setTimeout(function () {
                            console.log("[ChivoxWsEngine] in _onWsError: webSocket reconnecting !!!");
                            that._doConnect({
                                app: lastConnectOptions.app,
                                tcpNoDelay: lastConnectOptions.tcpNoDelay,
                                success: function success() {
                                    that._doStart(that._lastStartOptions);
                                },
                                fail: function fail(res) {
                                    ChivoxFire.Fail(that._lastStartOptions, res);
                                }
                            });
                        }, 100);
                    } else {
                        that._logBus({ est: ChivoxWsLogBus.WsConnectFail, reason: res.errMsg });
                        var err = { errId: ChivoxWsErr.ConnectFail,
                            error: "[ChivoxWsEngine] connect websocket server fail, " + res.errMsg + ". "
                        };
                        that.reset();
                        if (typeof lastConnectOptions !== "undefined") {
                            ChivoxFire.Fail(lastConnectOptions, err);
                        } else {
                            console.error("[ChivoxWsEngine] _onWsError: lastConnectOptions undefined");
                        }
                    }
                    return;
                }

                if (status == ChivoxWsEngineStatus.Ready || status == ChivoxWsEngineStatus.Resulted) {
                    that.reset();
                    return;
                }

                if (status == ChivoxWsEngineStatus.Evaluating || status == ChivoxWsEngineStatus.Resulting) {
                    var _err12 = { errId: ChivoxWsErr.NetException,
                        error: "[ChivoxWsEngine] websocket error. errMsg: " + res.errMsg + ". ",
                        tokenId: that._tokenId
                    };
                    that.reset();
                    ChivoxFire.OnErrorResult(that, _err12);
                    return;
                }
            };
        }
    }, {
        key: "_onWsClose",
        value: function _onWsClose(wsClient) {
            var that = this;

            return function (res) {
                if (that._reConnecting === ChivoxWsEngineReStatus.reConnecting) return;
                that._logBus({ est: ChivoxWsLogBus.WsConnectClose, reason: res.errMsg });
                console.log("[ChivoxWsEngine] _onWsClose(), at status: " + that._status);
                if (that._wsClient !== wsClient) {
                    console.log("[ChivoxWsEngine] _onWsClose: engine has been reset. not current wsClient's event.");
                    return;
                }

                var status = that._status;
                if (status == ChivoxWsEngineStatus.None) {
                    // 逻辑上不可能出现这种情况
                    console.error("[ChivoxWsEngine] _onWsClose: code logic error, status: " + that._status);
                    that.reset();
                    return;
                }

                if (status == ChivoxWsEngineStatus.Connecting) {
                    var lastConnectOptions = that._lastConnectOptions;
                    var err = { errId: ChivoxWsErr.ConnectFail,
                        error: "[ChivoxWsEngine] connect websocket server fail, " + res.errMsg + ". "
                    };
                    that.reset();
                    if (typeof lastConnectOptions !== "undefined") {
                        ChivoxFire.Fail(lastConnectOptions, err);
                    } else {
                        console.error("[ChivoxWsEngine] _onWsClose: lastConnectOptions undefined");
                    }
                    return;
                }

                if (status == ChivoxWsEngineStatus.Ready || status == ChivoxWsEngineStatus.Resulted) {
                    that.reset();
                    return;
                }

                if (status == ChivoxWsEngineStatus.Evaluating || status == ChivoxWsEngineStatus.Resulting) {
                    var _err13 = { errId: ChivoxWsErr.NetException,
                        error: "[ChivoxWsEngine] websocket closed. errMsg: " + res.errMsg + ". ",
                        tokenId: that._tokenId
                    };
                    that.reset();
                    ChivoxFire.OnErrorResult(that, _err13);
                    return;
                }
            };
        }
    }, {
        key: "_onWaitResultTimeout",
        value: function _onWaitResultTimeout() {
            var that = this;

            return function (res) {
                console.log("[ChivoxWsEngine] _onWaitResultTimeout, at status: " + that._status);
                that._logBus({ est: ChivoxWsLogBus.GetResultTimeOut, reason: "server timeout" });
                var status = that._status;
                if (status == ChivoxWsEngineStatus.Resulting) {
                    var err = { errId: ChivoxWsErr.ServerTimeout,
                        error: "[ChivoxWsEngine] server timeout",
                        tokenId: that._tokenId
                    };
                    that.reset();
                    ChivoxFire.OnErrorResult(that, err);
                    return;
                }

                // 逻辑上不可能执行到这里

                that.reset();
                console.error("[ChivoxWsEngine] _onWaitResultTimeout: status error, status: " + that._status);
            };
        }
    }, {
        key: "_logBus",
        value: function _logBus(options) {
            var that = this;
            var os_res = wx.getSystemInfoSync();
            options.os_version = os_res.system;
            options.timeStamp = new Date().getTime();
            options.uid = typeof that._lastStartOptions.request.uid == "string" ? that._lastStartOptions.request.uid : "unknow";
            options.appId = that._lastStartOptions.app.applicationId;
            options.reason = typeof options.reason == "string" ? options.reason : "unknow";
            var log_bus = { uid: options.uid, applicationId: options.appId, protocol: "1", os_version: options.os_version, body: [{ est: options.est, timestamp: options.timeStamp, reason: options.reason }] };

            wx.request({
                url: "https://log.cloud.chivox.com/bus?ver=2",
                method: "POST",
                data: "log=" + JSON.stringify(log_bus),
                fail: function fail(res) {
                    console.error("[ChivoxWsEngine] _logBus():send logbus fail," + res.errMsg);
                }
            });
        }
    }]);

    return ChivoxWsEngine;
}();

/*
    状态转换图：
                    None
                      ↓
                    Ready <----+ <-------------------+ <--+
                      ↓        |                     |    |
                    Starting --+                     |    |
                      ↓                              |    |
                    (Recording<-->Paused) --+        |    |
                      ↓                     ↓        |    |
                    Stoping -----------> Canceling --+    |
                      ↓                     ↑             |
                    Resulting --------------+-------------+
 */

var ChivoxAiEngineStatus = {
    None: "None", // 无状态
    Ready: "Ready", // 就绪态 （初始化完成 或 评分已结束 或 评分已取消）
    Starting: "Starting", // 正在开始
    Recording: "Recording", // 录音中
    Paused: "Paused", // 录音暂停
    Stoping: "Stoping", // 正在结束
    Resulting: "Resulting", // 等待结果中 （此时录音机已关闭）
    Canceling: "Canceling" // 正在取消
};

var ChivoxAiEngine = function () {
    function ChivoxAiEngine() {
        _classCallCheck(this, ChivoxAiEngine);

        var that = this;
        that._version = ChivoxSdkVersion;
        that._status = ChivoxAiEngineStatus.None;
        that._wsEngine = undefined;
        that._recorder = undefined;

        that._onRecorderStart = undefined;
        that._onRecorderPause = undefined;
        that._onRecorderResume = undefined;
        that._onRecorderStop = undefined;
        that._onRecorderError = undefined;
        that._onRecorderFrame = undefined;

        that._onResult = undefined;
        that._onErrorResult = undefined;

        that._lastStartOptions = undefined;
        that._lastStopOptions = undefined;
        that._lastCancelOptions = undefined;
        that._stopOriStatus = undefined;
        that._cancelOriStatus = undefined;
        that._serverTimeout = 60000; //评分超时时间
    }

    _createClass(ChivoxAiEngine, [{
        key: "getVersion",
        value: function getVersion() {
            var that = this;return ChivoxUtils.getVersion(that._version);
        }

        /**
         * createWsEngine 创建Websocket引擎
         * @param {boolean} gray [可选] 是否使用灰度服
         * @param {string} server [可选-非公开] 指定服务器，如果传入此参数，则忽略gray
         */

    }, {
        key: "createWsEngine",
        value: function createWsEngine(cfg) {
            var wsEngine = new ChivoxWsEngine();
            wsEngine.init(cfg);
            return wsEngine;
        }

        /**
         * 录音开始事件
         * @param {function} func 回调函数
         *     func 的参数 void
         */

    }, {
        key: "onRecorderStart",
        value: function onRecorderStart(func) {
            this._onRecorderStart = func;
        }

        /**
         * 录音暂停事件
         * @param {function} func 回调函数
         *     func 的参数 void
         */

    }, {
        key: "onRecorderPause",
        value: function onRecorderPause(func) {
            this._onRecorderPause = func;
        }

        /**
         * 录音恢复事件
         * @param {function} func 回调函数
         *     func 的参数 void
         */

    }, {
        key: "onRecorderResume",
        value: function onRecorderResume(func) {
            this._onRecorderResume = func;
        }

        /**
         *  接收录音数据事件
         *  @param {function} func 回调函数
         *     func 的参数 {object} res - 录音分片数据
         *     frameBuffer	{ArrayBuffer} 录音分片数据
         *     isLastFrame	{boolean} 当前帧是否正常录音结束前的最后一帧
         * */

    }, {
        key: "onRecorderFrame",
        value: function onRecorderFrame(func) {
            this._onRecorderFrame = func;
        }

        /**
         * 录音停止事件
         * @param {function} func 回调函数
         *     func 的参数 {object} res
         *         waitingResult: {boolean} 是否需等待评分结果
         *         tempFilePath: {string} 录音文件路径，这是个临时文件
         */

    }, {
        key: "onRecorderStop",
        value: function onRecorderStop(func) {
            this._onRecorderStop = func;
        }

        /**
         * 录音机错误事件
         * @param {function} func 回调函数
         *     func 的参数 {object} res
         *         errId: {int} 错误ID
         *         error: {string} 错误描述
         */

    }, {
        key: "onRecorderError",
        value: function onRecorderError(func) {
            this._onRecorderError = func;
        }

        /**
         * 评分结果回调
         * @param {function} func 回调函数
         *     func 的参数 {object} res - 评分结果
         */

    }, {
        key: "onResult",
        value: function onResult(func) {
            this._onResult = func;
        }

        /**
         * 错误结果回调
         * 当收到此回调时，请调用 aiengine_cancel 取消当前评测。
         * @param {function} func 回调函数
         *     func 的参数 {object} res - 评分结果
         *         errId: {int} 错误ID
         *         error: {string} 错误描述
         *         tokenId: {string} 评分任务唯一标识
         */

    }, {
        key: "onErrorResult",
        value: function onErrorResult(func) {
            this._onErrorResult = func;
        }

        /**
         * aiengine_new 初始化评分引擎 （本函数一旦调用成功以后，请永远不要再次调用了）。
         * @param {boolean} gray [可选] 是否使用灰度服务器
         * @param {string} server [可选，非公开] 使用特定的服务器地址，若传入此参数，则忽略gray
         * @param {function} success [必须] 接口调用成功事件
         * @param {function} fail [必须] 接口调用失败事件
         *     fail 的参数 {object} res
         *         errId: {int} 错误ID
         *         error: {string} 错误描述
         * @param {function} complete [可选] 接口调用完毕事件
         */

    }, {
        key: "aiengine_new",
        value: function aiengine_new(options) {
            var that = this;
            console.log("[ChivoxAiEngine] aiengine_new()");

            if (that._status != ChivoxAiEngineStatus.None) {
                var err = { errId: ChivoxAiErr.NewRepeatedly,
                    error: "[ChivoxAiEngine] call 'aiengine_new' repeatedly. "
                };
                ChivoxFire.Fail(options, err);
                return;
            }

            // 创建 ChivoxWsEngine
            if (typeof that._wsEngine === "undefined") {
                that._wsEngine = that.createWsEngine({
                    gray: options.gray, server: options.server
                });
                that._wsEngine.onResult(that._wsEngineOnResult());
                that._wsEngine.onErrorResult(that._wsEngineOnErrorResult());
            }

            that._status = ChivoxAiEngineStatus.Ready;
            ChivoxFire.Success(options);
        }

        /**
         * aiengine_start 启动评分引擎
         * @param {object} app [必须] 身份验证信息，在连接服务器时使用。
         * @param {object} request [必须] 评分请求
         * @param {object} audio [可选] 录音参数。
         *     {
         *         sampleRate: {int} [可选-默认值16000] 录音采样率 取值范围 (16000, 44100)
         *         duration: {int} [可选-默认值600000] 录音时长，单位毫秒，到达该时长后录音机自动停止。
         *     }
         * @param {function} success [必须] 接口调用成功事件（收到此事件时录音机已开始录音）
         *     success 的参数 {object} res
         *             {
         *                 tokenId: {string} 评分任务唯一标识
         *             }
         * @param {function} fail [必须] 接口调用失败事件
         *     fail 的参数 {object} res
         *         {
         *             errId: {int} 错误ID
         *             error: {string} 错误描述
         *         }
         * @param {function} complete [可选] 接口调用完毕事件
         */

    }, {
        key: "aiengine_start",
        value: function aiengine_start(options) {
            var that = this;
            console.log("[ChivoxAiEngine] aiengine_start()");

            if (that._status != ChivoxAiEngineStatus.Ready) {

                if (that._status == ChivoxAiEngineStatus.None) {
                    var _err15 = { errId: ChivoxAiErr.NotYetNew,
                        error: "[ChivoxAiEngine] you must call 'aiengine_new' first. "
                    };
                    ChivoxFire.Fail(options, _err15);
                    return;
                }

                if (that._status == ChivoxAiEngineStatus.Starting || that._status == ChivoxAiEngineStatus.Recording || that._status == ChivoxAiEngineStatus.Paused) {
                    var _err16 = { errId: ChivoxAiErr.StartRepeatedly,
                        error: "[ChivoxAiEngine] you should not call 'aiengine_start' repeatedly. "
                    };
                    ChivoxFire.Fail(options, _err16);
                    return;
                }

                if (that._status == ChivoxAiEngineStatus.Stoping) {
                    var _err17 = { errId: ChivoxAiErr.WaitStopFinish,
                        error: "[ChivoxAiEngine] you must wait 'aiengine_stop' completed. "
                    };
                    ChivoxFire.Fail(options, _err17);
                    return;
                }

                if (that._status == ChivoxAiEngineStatus.Resulting) {
                    var _err18 = { errId: ChivoxAiErr.WaitResulted,
                        error: "[ChivoxAiEngine] you must wait engine result. "
                    };
                    ChivoxFire.Fail(options, _err18);
                    return;
                }

                if (that._status == ChivoxAiEngineStatus.Canceling) {
                    var _err19 = { errId: ChivoxAiErr.WaitCancelFinish,
                        error: "[ChivoxAiEngine] you must wait 'aiengine_cancel' completed. "
                    };
                    ChivoxFire.Fail(options, _err19);
                    return;
                }

                // 逻辑上不可能执行到这里

                var _err14 = { errId: ChivoxAiErr.EngineStatus,
                    error: "[ChivoxAiEngine] engine status error, status: " + that._status + ". "
                };
                ChivoxFire.Fail(options, _err14);
                return;
            }

            that._status = ChivoxAiEngineStatus.Starting;

            var err = {};
            if (!ChivoxUtils.isValidRequest(options.request, err, "[ChivoxAiEngine]")) {
                that._status = ChivoxAiEngineStatus.Ready;
                ChivoxFire.Fail(options, err);
                return;
            }

            err = {};
            if (!ChivoxUtils.isValidApp(options.app, err, "[ChivoxAiEngine]")) {
                that._status = ChivoxAiEngineStatus.Ready;
                ChivoxFire.Fail(options, err);
                return;
            }

            that._recorderBind();
            // ---- audio ---- 
            var audioOpt = {
                duration: 600000, // 默认录音时长, 微信录音机最大支持 600000 毫秒
                format: "mp3",
                numberOfChannels: 1,
                sampleRate: 16000, // 默认采样率 16000
                frameSize: 5 // 每帧5KB
            };
            if (_typeof(options.audio) === "object") {
                if (typeof options.audio.sampleRate === "number") {
                    audioOpt.sampleRate = options.audio.sampleRate;
                }
                if (typeof options.audio.duration === "number" && options.audio.duration >= 500 && options.audio.duration < 600000) {
                    audioOpt.duration = options.audio.duration;
                }
            }
            if (audioOpt.sampleRate >= 44100) {
                audioOpt.encodeBitRate = 128000;
            }
            // ---- audio ----

            that._lastStartOptions = options;
            that._recorder.start(audioOpt);
        }

        /**
         * aiengine_stop 结束评测 （如果小程序进入后台，请不要调用这个方法）
         * @param {function} success [必须] 接口调用成功事件（收到此事件时录音机已开始录音）
         * @param {function} fail [必须] 接口调用失败事件
         *     fail 的参数 {object} res
         *         {
         *             errId: {int} 错误ID
         *             error: {string} 错误描述
         *         }
         * @param {function} complete [可选] 接口调用完毕事件
         */

    }, {
        key: "aiengine_stop",
        value: function aiengine_stop(options) {
            var that = this;
            console.log("[ChivoxAiEngine] aiengine_stop()");

            if (that._status != ChivoxAiEngineStatus.Recording && that._status != ChivoxAiEngineStatus.Paused) {

                if (that._status == ChivoxAiEngineStatus.None) {
                    var _err20 = { errId: ChivoxAiErr.NotYetNew,
                        error: "[ChivoxAiEngine] you must call 'aiengine_new' first. "
                    };
                    ChivoxFire.Fail(options, _err20);
                    return;
                }
                if (that._status == ChivoxAiEngineStatus.Ready) {
                    var _err21 = { errId: ChivoxAiErr.NotYetStart,
                        error: "[ChivoxAiEngine] you must call 'aiengine_start' first. "
                    };
                    ChivoxFire.Fail(options, _err21);
                    return;
                }
                if (that._status == ChivoxAiEngineStatus.Starting) {
                    var _err22 = { errId: ChivoxAiErr.WaitStartFinish,
                        error: "[ChivoxAiEngine] you must wait 'aiengine_start' completed. "
                    };
                    ChivoxFire.Fail(options, _err22);
                    return;
                }
                if (that._status == ChivoxAiEngineStatus.Stoping || that._status == ChivoxAiEngineStatus.Resulting) {
                    var _err23 = { errId: ChivoxAiErr.StopRepeatedly,
                        error: "[ChivoxAiEngine] you should not call 'aiengine_stop' repeatedly. "
                    };
                    ChivoxFire.Fail(options, _err23);
                    return;
                }
                if (that._status == ChivoxAiEngineStatus.Canceling) {
                    var _err24 = { errId: ChivoxAiErr.WaitCancelFinish,
                        error: "[ChivoxAiEngine] you must wait 'aiengine_cancel' completed. "
                    };
                    ChivoxFire.Fail(options, _err24);
                    return;
                }

                // 逻辑上不可能执行到这里

                var err = { errId: ChivoxAiErr.EngineStatus,
                    error: "[ChivoxAiEngine] engine status error, status: " + that._status + ". "
                };
                ChivoxFire.Fail(options, err);
                return;
            }

            var oldStatus = that._status;
            that._status = ChivoxAiEngineStatus.Stoping;
            that._lastStopOptions = options;
            that._stopOriStatus = oldStatus;
            that._recorder.stop();
        }

        /**
         * 暂停录音
         */

    }, {
        key: "aiengine_pause",
        value: function aiengine_pause() {
            var that = this;
            console.log("[ChivoxAiEngine] aiengine_pause(), at status: " + that._status);

            if (that._status != ChivoxAiEngineStatus.Recording) {
                if (that._status == ChivoxAiEngineStatus.Paused) {
                    return;
                }
                //console.warn("[ChivoxAiEngine] aiengine_pause: status is not recording, status: " + that._status);
                return;
            }
            that._recorder.pause();
        }

        /**
         * 恢复录音
         */

    }, {
        key: "aiengine_resume",
        value: function aiengine_resume() {
            var that = this;
            console.log("[ChivoxAiEngine] aiengine_resume(), at status: " + that._status);

            if (that._status != ChivoxAiEngineStatus.Paused) {
                if (that._status == ChivoxAiEngineStatus.Recording) {
                    return;
                }
                //console.warn("[ChivoxAiEngine] aiengine_resume: status error, status: " + that._status);
                return;
            }

            that._recorder.resume();
        }

        /**
        *  aiengine_opt 设置引擎参数（评分超时时间）
        *  key {string} [必须] 当key为serverTimeout,将value赋值到 this._serverTimeout
        *  value {number} [必须] value值为 ms,
        * */

    }, {
        key: "aiengine_opt",
        value: function aiengine_opt(key, value) {
            var that = this;
            var allow_opt = ["serverTimeout"];
            if (allow_opt.includes(key) > -1) {
                that["_" + key] = value;
            }
        }

        /**
         * aiengine_cancel 取消评测 （如果小程序进入后台，请不要调用这个方法）
         * @param {function} success [必须] 接口调用成功事件（收到此事件时录音机已开始录音）
         * @param {function} fail [必须] 接口调用失败事件
         *     fail 的参数 {object} res
         *         {
         *             errId: {int} 错误ID
         *             error: {string} 错误描述
         *         }
         * @param {function} complete [可选] 接口调用完毕事件
         */

    }, {
        key: "aiengine_cancel",
        value: function aiengine_cancel(options) {
            var that = this;
            console.log("[ChivoxAiEngine] aiengine_cancel(), at status: " + that._status);

            if (that._status != ChivoxAiEngineStatus.Ready && that._status != ChivoxAiEngineStatus.Recording && that._status != ChivoxAiEngineStatus.Paused && that._status != ChivoxAiEngineStatus.Stoping && that._status != ChivoxAiEngineStatus.Resulting) {

                if (that._status == ChivoxAiEngineStatus.None) {
                    var _err25 = { errId: ChivoxAiErr.NotYetNew,
                        error: "[ChivoxAiEngine] you must call 'aiengine_new' first. "
                    };
                    ChivoxFire.Fail(options, _err25);
                    return;
                }

                if (that._status == ChivoxAiEngineStatus.Starting) {
                    var _err26 = { errId: ChivoxAiErr.WaitStartFinish,
                        error: "[ChivoxAiEngine] you must wait 'aiengine_start' completed. "
                    };
                    ChivoxFire.Fail(options, _err26);
                    return;
                }

                if (that._status == ChivoxAiEngineStatus.Canceling) {
                    var _err27 = { errId: ChivoxAiErr.WaitCancelFinish,
                        error: "[ChivoxAiEngine] you must wait 'aiengine_cancel' completed. "
                    };
                    ChivoxFire.Fail(options, _err27);
                    return;
                }

                // 逻辑上不可能执行到这里

                var err = { errId: ChivoxAiErr.EngineStatus,
                    error: "[ChivoxAiEngine] engine status error, status: " + that._status + ". "
                };
                ChivoxFire.Fail(options, err);
                return;
            }

            if (that._status == ChivoxAiEngineStatus.Ready) {
                ChivoxFire.Success(options);
                return;
            }

            if (that._status == ChivoxAiEngineStatus.Recording || that._status == ChivoxAiEngineStatus.Paused) {
                var oldStatus = that._status;
                that._status = ChivoxAiEngineStatus.Canceling;
                that._lastCancelOptions = options;
                that._cancelOriStatus = oldStatus;
                that._recorder.stop();
                return;
            }

            if (that._status == ChivoxAiEngineStatus.Stoping) {

                that._lastCancelOptions = options;
                that._cancelOriStatus = that._stopOriStatus;
                that._status = ChivoxAiEngineStatus.Canceling;

                var _err28 = { errId: ChivoxAiErr.OperationCanceled,
                    error: "[ChivoxAiEngine] the call of 'aiengine_stop' has be canceled. "
                };

                var lastStopOptions = that._lastStopOptions;
                that._lastStopOptions = undefined;
                that._stopOriStatus = undefined;

                if (typeof lastStopOptions !== "undefined") {
                    ChivoxFire.Fail(lastStopOptions, _err28);
                } else {
                    console.error("[ChivoxAiEngine] aiengine_cancel: _lastStopOptions undefined");
                }
                return;
            }

            if (that._status == ChivoxAiEngineStatus.Resulting) {
                that._wsEngine.reset();
                that._status = ChivoxAiEngineStatus.Ready;
                ChivoxFire.Success(options);
                return;
            }

            return;
        }
    }, {
        key: "_wsEngineOnResult",
        value: function _wsEngineOnResult() {
            var that = this;

            return function (res) {
                console.log("[ChivoxAiEngine] _wsEngineOnResult(), at status: " + that._status);

                if (that._status != ChivoxAiEngineStatus.Recording && that._status != ChivoxAiEngineStatus.Paused && that._status != ChivoxAiEngineStatus.Stoping && that._status != ChivoxAiEngineStatus.Resulting) {
                    console.warn("[ChivoxAiEngine] _wsEngineOnResult: status error, status: " + that._status);
                    return;
                }

                if (that._status == ChivoxAiEngineStatus.Recording || that._status == ChivoxAiEngineStatus.Paused || that._status == ChivoxAiEngineStatus.Stoping) {
                    if (res.eof == 1) {
                        console.warn("[ChivoxAiEngine] _wsEngineOnResult: server response result eof=1, but we never send stop!!!");
                    }
                    ChivoxFire.OnResult(that, res);
                    return;
                }

                if (that._status == ChivoxAiEngineStatus.Resulting) {
                    if (res.eof == 1) {
                        that._status = ChivoxAiEngineStatus.Ready;
                    }
                    ChivoxFire.OnResult(that, res);
                    return;
                }
            };
        }
    }, {
        key: "_wsEngineOnErrorResult",
        value: function _wsEngineOnErrorResult() {
            var that = this;

            return function (res) {
                console.log("[ChivoxAiEngine] _wsEngineOnErrorResult(), at status: " + that._status);

                if (that._status != ChivoxAiEngineStatus.Recording && that._status != ChivoxAiEngineStatus.Paused && that._status != ChivoxAiEngineStatus.Stoping && that._status != ChivoxAiEngineStatus.Resulting) {
                    console.warn("[ChivoxAiEngine] _wsEngineOnErrorResult: status error, status: " + that._status);
                    return;
                }

                if (that._status == ChivoxAiEngineStatus.Recording || that._status == ChivoxAiEngineStatus.Paused || that._status == ChivoxAiEngineStatus.Stoping) {
                    ChivoxFire.OnErrorResult(that, res);
                    return;
                }

                if (that._status == ChivoxAiEngineStatus.Resulting) {
                    that._status = ChivoxAiEngineStatus.Ready;
                    ChivoxFire.OnErrorResult(that, res);
                    return;
                }
            };
        }
    }, {
        key: "_recorderBind",
        value: function _recorderBind() {
            var that = this;
            if (this._recorder) {
                this._recorderUnbind();
            }
            this._recorder = wx.getRecorderManager();
            this._recorder.onStart(that._recorderOnStart());
            this._recorder.onPause(that._recorderOnPause());
            this._recorder.onStop(that._recorderOnStop());
            this._recorder.onError(that._recorderOnError());
            this._recorder.onFrameRecorded(that._recorderOnFrame());
        }
    }, {
        key: "_recorderUnbind",
        value: function _recorderUnbind() {
            if (this._recorder) {
                this._recorder.onStart(null);
                this._recorder.onPause(null);
                this._recorder.onStop(null);
                this._recorder.onError(null);
                this._recorder.onFrameRecorded(null);
                this._recorder = null;
            }
        }
    }, {
        key: "_recorderOnStart",
        value: function _recorderOnStart() {
            var that = this;

            return function (res) {
                console.log("[ChivoxAiEngine] _recorderOnStart(), at status: " + that._status);

                if (that._status != ChivoxAiEngineStatus.Paused && that._status != ChivoxAiEngineStatus.Starting) {
                    that._status = ChivoxAiEngineStatus.Recording;
                    console.error("[ChivoxAiEngine] _recorderOnStart: status error, status: " + that._status);
                    return;
                }

                if (that._status == ChivoxAiEngineStatus.Paused) {
                    // 恢复录音机
                    that._status = ChivoxAiEngineStatus.Recording;
                    ChivoxFire.OnRecorderResume(that, res);
                    return;
                }

                if (that._status == ChivoxAiEngineStatus.Starting) {
                    // 启动录音机
                    that._status = ChivoxAiEngineStatus.Recording;

                    that._msgQueue = [];
                    that._allAudioFrames = [];

                    var lastStartOptions = that._lastStartOptions;
                    that._lastStartOptions = undefined;

                    if (typeof lastStartOptions === "undefined") {
                        console.error("[ChivoxAiEngine] _recorderOnStart: _lastStartOptions undefined");
                        return;
                    }

                    var tokenId = ChivoxUtils.generateGuid().replace(/-/g, "");

                    // ---- audio ----
                    var sysInfo = wx.getSystemInfoSync();
                    var audio = {
                        audioType: "mp3",
                        channel: 1,
                        sampleBytes: 2,
                        sampleRate: 16000
                    };
                    if (sysInfo.platform === "devtools") {
                        audio.audioType = "opus";
                    }
                    if (_typeof(lastStartOptions.audio) === "object" && typeof lastStartOptions.audio.sampleRate === "number") {
                        audio.sampleRate = lastStartOptions.audio.sampleRate;
                    }
                    // ---- audio ----

                    that._wsEngine.start({
                        tokenId: tokenId,
                        request: lastStartOptions.request,
                        audio: audio,
                        app: lastStartOptions.app,
                        tcpNoDelay: lastStartOptions.tcpNoDelay,
                        fail: function fail(res) {
                            console.log("[ChivoxAiEngine] wsEngine start fail! " + JSON.stringify(res));
                            that._wsEngine.reset();
                            ChivoxFire.OnErrorResult(that, res);
                        }, success: function success(res) {
                            console.log("[ChivoxAiEngine] wsEngine start success!");
                            that.__msgIterate();
                        }
                    });

                    ChivoxFire.Success(lastStartOptions, { tokenId: tokenId });
                    ChivoxFire.OnRecorderStart(that);
                }
            };
        }
    }, {
        key: "_recorderOnPause",
        value: function _recorderOnPause() {
            var that = this;

            return function (res) {
                console.log("[ChivoxAiEngine] _recorderOnPause(), at status: " + that._status);

                if (that._status != ChivoxAiEngineStatus.Recording) {
                    that._status = ChivoxAiEngineStatus.Paused;
                    console.error("[ChivoxAiEngine] _recorderOnPause: status error, status: " + that._status);
                    return;
                }

                that._status = ChivoxAiEngineStatus.Paused;
                ChivoxFire.OnRecorderPause(that, res);
            };
        }
    }, {
        key: "_recorderOnStop",
        value: function _recorderOnStop() {
            var that = this;

            return function (res) {
                console.log("[ChivoxAiEngine] _recorderOnStop(), at status: " + that._status);
                that._recorderUnbind();
                if (that._status != ChivoxAiEngineStatus.Recording && that._status != ChivoxAiEngineStatus.Paused && that._status != ChivoxAiEngineStatus.Stoping && that._status != ChivoxAiEngineStatus.Canceling) {
                    console.error("[ChivoxAiEngine] _recorderOnStop: status error, status: " + that._status);
                    that._wsEngine.reset();
                    that._status = ChivoxAiEngineStatus.Ready;
                    ChivoxFire.OnRecorderStop(that, {
                        waitingResult: false,
                        tempFilePath: res.tempFilePath
                    });
                    return;
                }

                if (that._status == ChivoxAiEngineStatus.Recording || that._status == ChivoxAiEngineStatus.Paused) {
                    // 录音超时自动停止

                    that._status = ChivoxAiEngineStatus.Resulting;

                    if (typeof that._msgQueue !== "undefined") {
                        that._msgQueue.push({ cmd: "stop" });
                        setTimeout(function () {
                            that.__msgIterate();
                        }, 1);
                    }

                    ChivoxFire.OnRecorderStop(that, {
                        waitingResult: true,
                        tempFilePath: res.tempFilePath
                    });
                    return;
                }

                if (that._status == ChivoxAiEngineStatus.Stoping) {
                    // 停止录音机成功

                    that._status = ChivoxAiEngineStatus.Resulting;

                    if (typeof that._msgQueue !== "undefined") {
                        that._msgQueue.push({ cmd: "stop" });
                        setTimeout(function () {
                            that.__msgIterate();
                        }, 1);
                    }

                    var lastStopOptions = that._lastStopOptions;
                    that._lastStopOptions = undefined;
                    that._stopOriStatus = undefined;

                    if (typeof lastStopOptions !== "undefined") {
                        ChivoxFire.Success(lastStopOptions);
                    } else {
                        console.error("[ChivoxAiEngine] _recorderOnStop: _lastStopOptions undefined");
                    }

                    ChivoxFire.OnRecorderStop(that, {
                        waitingResult: true,
                        tempFilePath: res.tempFilePath
                    });

                    return;
                }

                if (that._status == ChivoxAiEngineStatus.Canceling) {
                    // 取消录音成功 

                    that._wsEngine.reset();
                    that._status = ChivoxAiEngineStatus.Ready;

                    var lastCancelOptions = that._lastCancelOptions;
                    that._lastCancelOptions = undefined;
                    that._cancelOriStatus = undefined;

                    if (typeof lastCancelOptions !== "undefined") {
                        ChivoxFire.Success(lastCancelOptions);
                    } else {
                        console.error("[ChivoxAiEngine] _recorderOnStop: _lastCancelOptions undefined");
                    }

                    ChivoxFire.OnRecorderStop(that, {
                        waitingResult: false,
                        tempFilePath: res.tempFilePath
                    });

                    return;
                }
            };
        }
    }, {
        key: "_recorderOnError",
        value: function _recorderOnError() {
            var that = this;
            return function (res) {
                console.log("[ChivoxAiEngine] _recorderOnError(), errMsg: " + res.errMsg);
                that._recorderUnbind();
                if (that._status != ChivoxAiEngineStatus.Starting && that._status != ChivoxAiEngineStatus.Recording && that._status != ChivoxAiEngineStatus.Paused && that._status != ChivoxAiEngineStatus.Stoping && that._status != ChivoxAiEngineStatus.Canceling) {
                    var err = { errId: ChivoxAiErr.WxRecorderError,
                        error: "[ChivoxAiEngine] recorder error at status(" + that._status + "), errMsg(" + res.errMsg + "). "
                    };
                    ChivoxFire.OnRecorderError(that, err);
                    return;
                }

                if (that._status == ChivoxAiEngineStatus.Starting) {
                    // 在开启录音机的时候发生错误

                    that._status = ChivoxAiEngineStatus.Ready;

                    var _err29 = { errId: ChivoxAiErr.StartRecorderFail,
                        error: "[ChivoxAiEngine] start recorder fail, errMsg(" + res.errMsg + "). "
                    };

                    var lastStartOptions = that._lastStartOptions;
                    that._lastStartOptions = undefined;

                    if (typeof lastStartOptions !== "undefined") {
                        ChivoxFire.Fail(lastStartOptions, _err29);
                    } else {
                        console.error("[ChivoxAiEngine] _recorderOnError: _lastStartOptions undefined");
                    }
                    return;
                }

                if (that._status == ChivoxAiEngineStatus.Recording || that._status == ChivoxAiEngineStatus.Paused) {
                    // 录音机在录音过程中发生错误

                    var _err30 = { errId: ChivoxAiErr.WxRecorderError,
                        error: "[ChivoxAiEngine] recorder error at status(" + that._status + "), errMsg(" + res.errMsg + "). "
                    };
                    ChivoxFire.OnRecorderError(that, _err30);
                    return;
                }

                if (that._status == ChivoxAiEngineStatus.Stoping) {
                    // 在停止录音机的时候发生错误

                    that._status = that._stopOriStatus;

                    var _err31 = { errId: ChivoxAiErr.StopRecorderFail,
                        error: "[ChivoxAiEngine] recorder stop fail, errMsg(" + res.errMsg + "). "
                    };

                    var lastStopOptions = that._lastStopOptions;
                    that._lastStopOptions = undefined;
                    that._stopOriStatus = undefined;

                    if (typeof lastStopOptions !== "undefined") {
                        ChivoxFire.Fail(lastStopOptions, _err31);
                    } else {
                        console.error("[ChivoxAiEngine] _recorderOnError: _lastStopOptions undefined");
                    }
                    return;
                }

                if (that._status == ChivoxAiEngineStatus.Canceling) {
                    // 在停止录音机的时候发生错误

                    that._status = that._cancelOriStatus;

                    var _err32 = { errId: ChivoxAiErr.CancelRecorderFail,
                        error: "[ChivoxAiEngine] recorder cancel fail, errMsg(" + res.errMsg + "). "
                    };

                    var lastCancelOptions = that._lastCancelOptions;
                    that._lastCancelOptions = undefined;
                    that._cancelOriStatus = undefined;

                    if (typeof lastCancelOptions !== "undefined") {
                        ChivoxFire.Fail(lastCancelOptions, _err32);
                    } else {
                        console.error("[ChivoxAiEngine] _recorderOnError: _lastCancelOptions undefined");
                    }
                    return;
                }
            };
        }
    }, {
        key: "_recorderOnFrame",
        value: function _recorderOnFrame() {
            var that = this;

            return function (res) {
                console.log("[ChivoxAiEngine] _recorderOnFrame(), at status: " + that._status);
                ChivoxFire.OnRecorderFrame(that, res);
                if ((typeof res === "undefined" ? "undefined" : _typeof(res)) !== "object") {
                    console.warn("[ChivoxAiEngine] _recorderOnFrame: res not object");
                    return;
                }
                if (null == res.frameBuffer) {
                    console.warn("[ChivoxAiEngine] _recorderOnFrame: res.frameBuffer is null");
                    return;
                }
                if (res.frameBuffer.byteLength <= 0) {
                    console.warn("[ChivoxAiEngine] _recorderOnFrame: res.frameBuffer is empty");
                    return;
                }

                console.debug("[ChivoxAiEngine] isLastFrame: " + res.isLastFrame + ", frameSize: ====== " + res.frameBuffer.byteLength);

                if (typeof that._allAudioFrames !== "undefined") {
                    that._allAudioFrames.push(res.frameBuffer);
                }

                if (that._status != ChivoxAiEngineStatus.Recording && that._status != ChivoxAiEngineStatus.Paused && that._status != ChivoxAiEngineStatus.Stoping && that._status != ChivoxAiEngineStatus.Canceling) {

                    console.error("[ChivoxAiEngine] _recorderOnFrame: status error, status = " + that._status);
                    return;
                }

                if (typeof that._msgQueue !== "undefined") {
                    that._msgQueue.push({
                        cmd: 'feed', data: res.frameBuffer
                    });

                    that.__msgIterate();
                }
            };
        }

        /**
         * 消息队列迭代
         */

    }, {
        key: "__msgIterate",
        value: function __msgIterate() {
            var that = this;

            console.debug("[ChivoxAiEngine] __msgIterate()");

            if (that._status == ChivoxAiEngineStatus.Canceling) {
                console.debug("[ChivoxAiEngine] __msgIterate: end for Canceling");
                return;
            }

            // 若消息队列已清空，停止迭代
            if (typeof that._msgQueue === "undefined") {
                console.debug("[ChivoxAiEngine] __msgIterate: end for _msgQueue undefined");
                return;
            }
            if (that._msgQueue.length === 0) {
                console.debug("[ChivoxAiEngine] __msgIterate: end for _msgQueue empty");
                return;
            }

            // 若wsEngine未开始，停止迭代
            if (!that._wsEngine.isStarted()) {
                return;
            }

            // TODO: 增加判断 是否已经回调过errorresult 或 eof=1 的 result

            // 取出一个消息
            var msg = that._msgQueue[0];
            that._msgQueue.splice(0, 1);

            if (msg.cmd == "feed") {
                that._wsEngine.feed({
                    data: msg.data,
                    fail: function fail(res) {
                        console.warn("[ChivoxAiEngine] feed fail! " + JSON.stringify(res));
                        that._wsEngine.reset();
                        ChivoxFire.OnErrorResult(that, res);
                    }, success: function success() {}, complete: function complete() {
                        setTimeout(function () {
                            that.__msgIterate();
                        }, 10); // 进行下一次迭代
                    }
                });
                return;
            } else if (msg.cmd == "stop") {
                that._wsEngine.stop({
                    //timeout: 60000,
                    timeout: that._serverTimeout,
                    fail: function fail(res) {
                        console.warn("[ChivoxAiEngine] stop fail! " + JSON.stringify(res));
                        that._wsEngine.reset();
                        ChivoxFire.OnErrorResult(that, res);
                    }, success: function success() {}, complete: function complete() {
                        setTimeout(function () {
                            that.__msgIterate();
                        }, 10); // 进行下一次迭代
                    }
                });
                return;
            } else {
                console.error("[ChivoxAiEngine] __msgIterate: invalid msg.cmd = " + msg.cmd);
            }
        }
    }]);

    return ChivoxAiEngine;
}();

var aiengine = new ChivoxAiEngine();
module.exports = aiengine;
