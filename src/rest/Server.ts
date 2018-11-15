/**
 * Created by rtholmes on 2016-06-19.
 */

import fs = require("fs");
import restify = require("restify");
import Log from "../Util";
import InsightFacade from "../controller/InsightFacade";
import {error} from "util";
import {InsightError, NotFoundError} from "../controller/IInsightFacade";

/**
 * This configures the REST endpoints for the server.
 */
export default class Server {

    private port: number;
    private rest: restify.Server;
    private static facade: InsightFacade;

    constructor(port: number) {
        Log.info("Server::<init>( " + port + " )");
        this.port = port;
    }

    /**
     * Stops the server. Again returns a promise so we know when the connections have
     * actually been fully closed and the port has been released.
     *
     * @returns {Promise<boolean>}
     */
    public stop(): Promise<boolean> {
        Log.info("Server::close()");
        const that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    }

    /**
     * Starts the server. Returns a promise with a boolean value. Promises are used
     * here because starting the server takes some time and we want to know when it
     * is done (and if it worked).
     *
     * @returns {Promise<boolean>}
     */
    public start(): Promise<boolean> {
        const that = this;
        return new Promise(function (fulfill, reject) {
            try {
                Log.info("Server::start() - start");

                that.rest = restify.createServer({
                    name: "insightUBC",
                });
                that.rest.use(restify.bodyParser({mapFiles: true, mapParams: true}));
                that.rest.use(
                    function crossOrigin(req, res, next) {
                        res.header("Access-Control-Allow-Origin", "*");
                        res.header("Access-Control-Allow-Headers", "X-Requested-With");
                        return next();
                    });

                // This is an example endpoint that you can invoke by accessing this URL in your browser:
                // http://localhost:4321/echo/hello
                // that.rest.get("/echo/:msg", Server.echo);
                that.rest.put("/dataset/:id/:kind", Server.putDataset);
                that.rest.get("/datasets", Server.getDataset);

                // NOTE: your endpoints should go here
                that.rest.post("/query", Server.postQuery);
                that.rest.del("/dataset/:id", Server.deleteDataset);

                // This must be the last endpoint!
                that.rest.get("/.*", Server.getStatic);

                that.rest.listen(that.port, function () {
                    Log.info("Server::start() - restify listening: " + that.rest.url);
                    fulfill(true);
                });

                that.rest.on("error", function (err: string) {
                    // catches errors in restify start; unusual syntax due to internal
                    // node not using normal exceptions here
                    Log.info("Server::start() - restify ERROR: " + err);
                    reject(err);
                });

            } catch (err) {
                Log.error("Server::start() - ERROR: " + err);
                reject(err);
            }
        });
    }

    // The next two methods handle the echo service.
    // These are almost certainly not the best place to put these, but are here for your reference.
    // By updating the Server.echo function pointer above, these methods can be easily moved.
    private static echo(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        try {
            const response = Server.performEcho(req.params.msg);
            Log.info("Server::echo(..) - responding " + 200);
            res.json(200, {result: response});
        } catch (err) {
            Log.error("Server::echo(..) - responding 400");
            res.json(400, {error: err});
        }
        return next();
    }

    private static performEcho(msg: string): string {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        } else {
            return "Message not provided";
        }
    }

    private static getStatic(req: restify.Request, res: restify.Response, next: restify.Next) {
        const publicDir = "frontend/public/";
        Log.trace("RoutHandler::getStatic::" + req.url);
        let path = publicDir + "index.html";
        if (req.url !== "/") {
            path = publicDir + req.url.split("/").pop();
        }
        fs.readFile(path, function (err: Error, file: Buffer) {
            if (err) {
                res.send(500);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

    // Self-implemented
    public static getInstanceInsightFacade(): InsightFacade {
        if (Server.facade === null || Server.facade === undefined) {
            Server.facade = new InsightFacade();
        }
        return Server.facade;
    }

    private static getDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        // if (!Server.isValidReq(req)) {
        //     return next(new Error("Invalid request format"));
        // }
        try {
            let facade = Server.getInstanceInsightFacade();
            facade.listDatasets().then(function (response) {
                res.json(200, {result: response});
            }).catch(function (err) {
                res.json(400, {error: err.message});
            });
        } catch (err) {
            res.send(400, {error: err.message});
        }
        return next();
    }

    private static putDataset (req: restify.Request, res: restify.Response, next: restify.Next) {
        // if (!Server.isValidReq(req)) {
        //     return next(new Error("Invalid request format"));
        // }
        try {
            let id = req.params.id;
            let kind = req.params.kind;
            let body = new Buffer(req.params.body).toString("base64");
            Server.getInstanceInsightFacade().addDataset(id, body, kind)
                .then((response) => {
                    res.json(200, {result: response});
                })
                .catch((err) => {
                    res.json(400, {error: err.message});
                });
        } catch (err) {
            res.send(400, {error: err.message});
        }
        return next();
    }

    private static deleteDataset (req: restify.Request, res: restify.Response, next: restify.Next) {
        // todo
        Log.trace("deleting dataset...");
        let id = req.params.id;
        try {
            Server.getInstanceInsightFacade().removeDataset(id)
                .then(function (response) {
                    res.json(200, {result: response});
                }).catch(function (err) {
                if (err.isPrototypeOf(NotFoundError)) {
                    res.json(404, {error: err.message});
                } else if (err.isPrototypeOf(InsightError)) {
                    res.json(400, {error: err.message});
                }
            });
        } catch (err) {
            res.send(400, {error: err.message});
        }
        return next();
    }

    private static postQuery(req: restify.Request, res: restify.Response, next: restify.Next) {
        try {
            Server.getInstanceInsightFacade().performQuery(req.params)
                .then(function (resoponse) {
                    res.json(200, {result: resoponse});
                }).catch(function (err) {
                    res.json(400, {error: err.message});
                });
        } catch (e) {
            res.send(400, {error: e.message});
        }
        return next();
    }

    private static isValidReq(req: restify.Request): boolean {
        if (!req.body || !req.body.name || !req.body.id) {
            return false;
        } else {
            return true;
        }
    }
}
