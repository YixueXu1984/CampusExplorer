import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import {expect} from "chai";
import {InsightDataset, InsightDatasetKind, InsightError} from "../src/controller/IInsightFacade";

// describe("AddDataSetRooms", () => {
//     const datasetsToLoad: { [id: string]: string } = {
//         rooms: "./test/data/rooms.zip",
//         roomsWith4RoomsANSO: "./test/data/roomsWith4RoomsANSO.zip",
//     };
//
//     let insightFacade: InsightFacade;
//     let datasets: { [id: string]: string };
//
//     before(async function () {
//         Log.test(`Before: ${this.test.parent.title}`);
//
//         try {
//             const loadDatasetPromises: Array<Promise<Buffer>> = [];
//             for (const [id, path] of Object.entries(datasetsToLoad)) {
//                 loadDatasetPromises.push(TestUtil.readFileAsync(path));
//             }
//             const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
//                 return {[Object.keys(datasetsToLoad)[i]]: buf.toString("base64")};
//             });
//             datasets = Object.assign({}, ...loadedDatasets);
//             expect(Object.keys(datasets)).to.have.length.greaterThan(0);
//         } catch (err) {
//             expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
//         }
//
//         try {
//             insightFacade = new InsightFacade();
//         } catch (err) {
//             Log.error(err);
//         } finally {
//             expect(insightFacade).to.be.instanceOf(InsightFacade);
//         }
//     });
//
//     beforeEach(function () {
//         Log.test(`BeforeTest: ${this.currentTest.title}`);
//     });
//
//     after(function () {
//         Log.test(`After: ${this.test.parent.title}`);
//         // reset datasets in memory & cache
//         let fs = require("fs-extra");
//         fs.removeSync("data/");
//     });
//
//     afterEach(function () {
//         Log.test(`AfterTest: ${this.currentTest.title}`);
//     });
//
//     it("Should have no dataset before add, test listDatasets()", async function () {
//         let response: InsightDataset[];
//         try {
//             response = await insightFacade.listDatasets();
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.deep.equal([]);
//         }
//     });
//
//     it("Should add a valid dataset: rooms", async () => {
//         const id: string = "rooms";
//         let response: string[];
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.deep.equal([id]);
//         }
//     });
//
//     it("Should have a dataset of rooms after add, test listDatasets()", async function () {
//         const name: string = "rooms";
//         let expectedDataset: InsightDataset = {
//             id: "rooms",
//             kind: InsightDatasetKind.Rooms,
//             numRows: 364
//         };
//         let expected: InsightDataset[] = [];
//         expected.push(expectedDataset);
//         let response: InsightDataset[] = [];
//         try {
//             response = await insightFacade.listDatasets();
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.deep.equal(expected);
//         }
//     });
//
//     it("Should not add a existing dataset", async () => {
//         const id: string = "rooms";
//         let response: string[];
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.be.instanceOf(InsightError);
//         }
//     });
//
//  it("Should still have only one dataset of courses after adding duplicate, test listDatasets()", async function () {
//         const name: string = "rooms";
//         let expectedDataset: InsightDataset = {
//             id: name,
//             kind: InsightDatasetKind.Rooms,
//             numRows: 364
//         };
//         let expected: InsightDataset[] = [];
//         expected.push(expectedDataset);
//         let response: InsightDataset[] = [];
//         try {
//             response = await insightFacade.listDatasets();
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.deep.equal(expected);
//         }
//     });
//
//     it("Should remove the rooms dataset", async () => {
//         const id: string = "rooms";
//         let response: string;
//
//         try {
//             response = await insightFacade.removeDataset(id);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.deep.equal(id);
//             expect(insightFacade.dataSets.length).to.deep.equal(0);
//         }
//     });
//
//     it("Should have no dataset after remove, test listDatasets()", async function () {
//         let response: InsightDataset[];
//         try {
//             response = await insightFacade.listDatasets();
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.deep.equal([]);
//         }
//     });
//
//     it("Should add a specific dataset: roomsWith4RoomsANSO", async () => {
//         const id: string = "roomsWith4RoomsANSO";
//         let response: string[];
//
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.deep.equal([id]);
//         }
//     });
//
//     it("Should have a dataset of roomsWith4RoomsANSO after add, test listDatasets()", async function () {
//         const id: string = "roomsWith4RoomsANSO";
//         let expectedDataset: InsightDataset = {
//             id: "roomsWith4RoomsANSO",
//             kind: InsightDatasetKind.Rooms,
//             numRows: 4
//         };
//         let expected: InsightDataset[] = [];
//         expected.push(expectedDataset);
//         let response: InsightDataset[] = [];
//         try {
//             response = await insightFacade.listDatasets();
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.deep.equal(expected);
//         }
//     });
//
//     it("Should add a valid dataset: rooms", async () => {
//         const id: string = "rooms";
//         let response: string[];
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.deep.equal([id]);
//         }
//     });
//
//     it("list 2 datasets", async () => {
//         let response: InsightDataset[];
//         let expectedResponse: InsightDataset[];
//         expectedResponse = [];
//         expectedResponse[0] = {
//             id: "roomsWith4RoomsANSO",
//             kind: InsightDatasetKind.Rooms,
//             numRows: 4,
//         };
//
//         expectedResponse[1] = {
//             id: "rooms",
//             kind: InsightDatasetKind.Rooms,
//             numRows: 364,
//         };
//
//         try {
//             response = await insightFacade.listDatasets();
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.deep.equal(expectedResponse);
//         }
//     });
//
//     it("Should throw error for adding rooms folder without index", async () => {
//         const id: string = "roomsWithoutIndex";
//         let response: string[];
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.be.instanceOf(InsightError);
//         }
//     });
//
//     it("Should remove the rooms dataset", async () => {
//         const id: string = "rooms";
//         let response: string;
//
//         try {
//             response = await insightFacade.removeDataset(id);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.deep.equal(id);
//             expect(insightFacade.dataSets.length).to.deep.equal(0);
//         }
//     });
//
//     it("Should remove the roomsWith4RoomsANSO dataset", async () => {
//         const id: string = "roomsWith4RoomsANSO";
//         let response: string;
//
//         try {
//             response = await insightFacade.removeDataset(id);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.deep.equal(id);
//             expect(insightFacade.dataSets.length).to.deep.equal(0);
//         }
//     });
//
//     it("Should add a valid dataset with 1 invalid building html: roomsInvalidANSOBadFormat", async () => {
//         const id: string = "roomsInvalidANSOBadFormat";
//         let response: string[];
//         try {
//             response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.deep.equal([id]);
//         }
//     });
//
//     it("Should have a dataset of rooms after add, test listDatasets()", async function () {
//         let expectedDataset: InsightDataset = {
//             id: "roomsInvalidANSOBadFormat",
//             kind: InsightDatasetKind.Rooms,
//             numRows: 360            // 4 datasets in ANSO is excluded due to bad html format
//         };
//         let expected: InsightDataset[] = [];
//         expected.push(expectedDataset);
//         let response: InsightDataset[] = [];
//         try {
//             response = await insightFacade.listDatasets();
//         } catch (err) {
//             response = err;
//         } finally {
//             expect(response).to.deep.equal(expected);
//         }
//     });
// });
