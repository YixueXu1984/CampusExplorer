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
        Log.trace("New test executed");
    });

    // TODO: read your courses and rooms datasets here once!

    // Hint on how to test PUT requests
    it("PUT test for courses dataset", function () {
        try {
            return chai.request(URL)
                .put("http://localhost:4321")
                .attach("body", fs.readFileSync("./test/data/courses.zip"), "courses.zip")
                .then(function (res: any) {  // why any
                    // some logging here please!
                    Log.trace("PUT executed");
                    expect(res.status).to.be.equal(204);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace("PUT failed");
            // and some more logging here!
        }
    });

    it("GET dataset", function () {
        try {
            return chai.request("http://localhost:4321")
                .get("/datasets")
                .then(function (res: any) {
                    Log.trace("Dataset List");
                    expect(res.status).to.be.equal(200);
                    const expectedBody = [{id: "courses", kind: InsightDatasetKind.Courses, numRows: 64612}];
                    expect(res.body).to.deep.equal({result: expectedBody});
                })
                .catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            Log.trace("GET failed");
        }
    });
    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
