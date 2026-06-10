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