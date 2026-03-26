import { Router } from "express";
import { chainRouter } from "./chain.js";
import { complianceRouter } from "./compliance.js";
import { healthRouter } from "./health.js";
import { nftRouter } from "./nft.js";
import { programRouter } from "./program.js";
import { rwaRouter } from "./rwa.js";
import { tokenizationRouter } from "./tokenization.js";
import { tradingRouter } from "./trading.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use("/rwa", rwaRouter);
apiRouter.use("/tokenization", tokenizationRouter);
apiRouter.use("/nft", nftRouter);
apiRouter.use("/trade", tradingRouter);
apiRouter.use("/program", programRouter);
apiRouter.use("/chain", chainRouter);
apiRouter.use("/compliance", complianceRouter);
