import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import {expect} from "chai";
import {InsightDataset, InsightDatasetKind, InsightError} from "../src/controller/IInsightFacade";

describe("AddDataSetRooms", () => {
    const datasetsToLoad: { [id: string]: string } = {
        rooms: "./test/data/rooms.zip",
        // specificRooms: "./test/data/specificRooms.zip",
    };

    let insightFacade: InsightFacade;
    let datasets: { [id: string]: string };

    before(async function () {
        Log.test(`Before: ${this.test.parent.title}`);

        try {
            const loadDatasetPromises: Array<Promise<Buffer>> = [];
            for (const [id, path] of Object.entries(datasetsToLoad)) {
                loadDatasetPromises.push(TestUtil.readFileAsync(path));
            }
            const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
                return { [Object.keys(datasetsToLoad)[i]]: buf.toString("base64") };
            });
            datasets = Object.assign({}, ...loadedDatasets);
            expect(Object.keys(datasets)).to.have.length.greaterThan(0);
        } catch (err) {
            expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
        }

        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        } finally {
            expect(insightFacade).to.be.instanceOf(InsightFacade);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
        // reset datasets in memory & cache
        let fs = require("fs-extra");
        fs.removeSync("data/");
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    it("Should have no dataset before add, test listDatasets()", async function () {
        let response: InsightDataset[];
        try {
            response = await insightFacade.listDatasets();
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([]);
        }
    });

    it("Should add a valid dataset: rooms", async () => {
        const id: string = "rooms";
        let response: string[];
        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([id]);
        }
    });

    it("Should have a dataset of courses after add, test listDatasets()", async function () {
        const name: string = "rooms";
        let expectedDataset: InsightDataset = {
            id: "rooms",
            kind: InsightDatasetKind.Rooms,
            numRows: 64612  // !!!!
        };
        let expected: InsightDataset[] = [];
        expected.push(expectedDataset);
        let response: InsightDataset[] = [];
        try {
            response = await insightFacade.listDatasets();
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(expected);
        }
    });

    it("Should not add a existing dataset", async () => {
        const id: string = "rooms";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.be.instanceOf(InsightError);
        }
    });

    it("Should still have only one dataset of courses after add, test listDatasets()", async function () {
        const name: string = "rooms";
        let expectedDataset: InsightDataset = {
            id: name,
            kind: InsightDatasetKind.Rooms,
            numRows: 64612 // !!!!
        };
        let expected: InsightDataset[] = [];
        expected.push(expectedDataset);
        let response: InsightDataset[] = [];
        try {
            response = await insightFacade.listDatasets();
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(expected);
        }
    });

    it("Should remove the courses dataset", async () => {
        const id: string = "rooms";
        let response: string;

        try {
            response = await insightFacade.removeDataset(id);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal(id);
            expect(insightFacade.dataSets.length).to.deep.equal(0);
        }
    });

    it("Should have no dataset after remove, test listDatasets()", async function () {
        let response: InsightDataset[];
        try {
            response = await insightFacade.listDatasets();
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([]);
        }
    });

    // it("Should add a specific dataset", async () => {
    //     const id: string = "specificRooms";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.deep.equal([id]);
    //     }
    // });

    // it("Should have a dataset of specific courses after add, test listDatasets()", async function () {
    //     const id: string = "specificRooms";
    //     let expectedDataset: InsightDataset = {
    //         id: "specificRooms",
    //         kind: InsightDatasetKind.Rooms,
    //         numRows: 61 // !!!!!!!!!
    //     };
    //     let expected: InsightDataset[] = [];
    //     expected.push(expectedDataset);
    //     let response: InsightDataset[] = [];
    //     try {
    //         response = await insightFacade.listDatasets();
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.deep.equal(expected);
    //     }
    // });

});
