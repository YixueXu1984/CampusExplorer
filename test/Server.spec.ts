import Server from "../src/rest/Server";
import {expect} from "chai";
import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");

import chaiHttp = require("chai-http");
import Log from "../src/Util";
import * as fs from "fs";
import {InsightDatasetKind} from "../src/controller/IInsightFacade";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;
    const URL: string = "http://localhost:4321";

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        // TODO: start server here once and handle errors properly
        server.start()
            .then((status) => {
                if (status) {
                    Log.trace("Server created");
                } else {
                    Log.trace("Fail to create server");
                }
            })
            .catch((err) => {
                Log.trace(err);
            });
    });

    after(function () {
        // TODO: stop server here once!
        server.stop()
            .then((status) => {
                if (status) {
                    Log.trace("Server closed");
                } else {
                    Log.trace("Fail to close server");
                }
            })
            .catch((err) => {
                Log.trace(err);
            });
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.trace("New test start:");
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.trace("New test executed \n");
    });

    // TODO: read your courses and rooms datasets here once!
    let courses = fs.readFileSync("./test/data/courses.zip");
    let rooms = fs.readFileSync("./test/data/rooms.zip");

    // Hint on how to test PUT requests
    it("PUT test for courses dataset", function () {
        try {
            return chai.request(URL)
                .put("/dataset/courses/courses")
                .attach("body", courses, "courses.zip")
                .then(function (res: any) {
                    // some logging here please!
                    Log.trace("PUT executed");
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                });
        } catch (err) {
            Log.trace("PUT failed");
            // and some more logging here!
        }
    });

    it("GET dataset", function () {
        try {
            return chai.request(URL)
                .get("/datasets")
                .then(function (res: any) {
                    Log.trace("Dataset List");
                    expect(res.status).to.be.equal(200);
                    const expectedBody = [{id: "courses", kind: InsightDatasetKind.Courses, numRows: 64612}];
                    expect(res.body).to.deep.equal({result: expectedBody});
                })
                .catch(function (err) {
                    Log.trace(err);
                });
        } catch (err) {
            Log.trace("GET failed");
        }
    });

    it("remove dataset", function () {
        try {
            return chai.request(URL)
                .del("/dataset/courses")
                .then(function (res: any) {
                    Log.trace("removing dataset:");
                    expect(res.status).to.be.equal(200);
                    const expectedBody = "courses";
                    expect(res.body).to.deep.equal({result: expectedBody});
                })
                .catch(function (err) {
                    Log.trace(err);
                });
        } catch (err) {
            Log.trace("DELETE failed");
        }

    });

    it("perform query", function () {
        let query = JSON.parse(fs.readFileSync("./test/queries/COUNT.json", "utf8"));
        try {
            return chai.request(URL)
                .post("/query").send(query)
                .then(function (res: any) {
                    Log.trace("performing query");
                    expect(res.status).to.be.equal(200);
                    const expectedBody = ["aaa"];
                    expect(res.body).to.deep.equal({result: expectedBody});
                }).catch(function (err) {
                     Log.trace(err);
                });
        } catch (err) {
            Log.trace("POST failed");
        }
    });
    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
