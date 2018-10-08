import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import {expect} from "chai";
import {InsightDataset, InsightDatasetKind} from "../src/controller/IInsightFacade";

describe("Test Util", () => {

    it("skip the sections if missing required field: Title, id, Professor, Audit, Year, Course, Pass", async () => {
        // todo

        // (process.env["LOG_LEVEL"] || "").toUpperCase();

        process.env["LOG_LEVEL"] = "TRACE";
        process.env["LOG_LEVEL"] = "INFO";
        process.env["LOG_LEVEL"]  = "WARN";
        process.env["LOG_LEVEL"] = "ERROR";
        process.env["LOG_LEVEL"] = "TEST";
        process.env["LOG_LEVEL"] = "NONE";

        Log.info("Test");
        Log.error("Test");
        Log.test("Test");
        Log.warn("Test");
        Log.trace("Test");
    });
});
