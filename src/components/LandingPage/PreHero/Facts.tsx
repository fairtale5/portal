import Link from "@docusaurus/Link";
import useGlobalData from "@docusaurus/useGlobalData";
import {
  getBlockCount,
  getBlockRate,
  getBytesStored,
  getSubnetCount,
  getTransactionRate,
  getTransactionRateV3,
} from "@site/src/utils/network-stats";
import {
  motion,
  MotionValue,
  useMotionValue,
  useTransform,
} from "framer-motion";
import React from "react";
import { useQuery } from "react-query";
import { CostSvg } from "./CostSvg";
import { ConstantRateCounter, SpringCounter } from "./Counters";
import InfoIcon from "./InfoIcon";

function formatNumber(x: number) {
  return x
    .toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })
    .replace(/,/g, "\u2019");
}

function formatStateSize(x: number) {
  return (
    (x / 1000000000000).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    }) + " TB"
  );
}

let lastTxRate = 0;
function transactionRateWithJitter(): Promise<number> {
  return getTransactionRate().then((rate) => {
    if (lastTxRate === rate) {
      return Math.max(0, rate + Math.random() * 40 - 20);
    }
    lastTxRate = rate;
    return rate;
  });
}

let lastUpdateTxRate = 0;
function updateRateWithJitter(): Promise<number> {
  return getTransactionRateV3("update").then((rate) => {
    if (lastUpdateTxRate === rate) {
      return Math.max(0, rate + Math.random() * 4 - 2);
    }
    lastUpdateTxRate = rate;
    return rate;
  });
}

function getFigureSpacer(value) {
  const valueDigitCount = value.toString().length;
  const valueDigitCountWithApostrophes =
    valueDigitCount + Math.floor((valueDigitCount - 1) / 3);
  const scheme = `999'999'999'999'999`;
  return scheme.slice(scheme.length - valueDigitCountWithApostrophes);
}

function TotalBlocks() {
  const blockInfoQuery = useQuery(["blockRate"], () =>
    Promise.all([getBlockCount(), getBlockRate()])
  );
  return (
    <div className="tw-title-sm md:tw-title-lg mb-2 inline-grid relative left-3">
      {blockInfoQuery.isFetched ? (
        <>
          <ConstantRateCounter
            start={blockInfoQuery.data[0]}
            ratePerSec={blockInfoQuery.data[1]}
            format={formatNumber}
            className="text-transparent bg-clip-text hero-stat-red col-start-1 row-start-1 text-left"
          ></ConstantRateCounter>
          <span className="col-start-1 row-start-1 invisible pointer-events-none pr-[2px]">
            {getFigureSpacer(Math.floor(blockInfoQuery.data[0]))}
          </span>
        </>
      ) : (
        <>&nbsp;</>
      )}
    </div>
  );
}

function ParallelSubnets(): JSX.Element {
  const subnetCountQuery = useQuery(["subnetCount"], getSubnetCount);
  return (
    <>
      {subnetCountQuery.isFetched ? subnetCountQuery.data : <>&nbsp;&nbsp;</>}
    </>
  );
}

function BlockThroughput(): JSX.Element {
  const finalizationRate = useQuery(["getFinalizationRate"], getBlockRate);
  return (
    <>
      {finalizationRate.isFetched ? (
        finalizationRate.data.toFixed(1)
      ) : (
        <>&nbsp;&nbsp;&nbsp;&nbsp;</>
      )}
    </>
  );
}

function EthEquivalentTxRate({
  gagueValue,
}: {
  gagueValue: MotionValue<number>;
}) {
  const updateTxRate = useQuery(["getUpdateTxRate"], updateRateWithJitter, {
    refetchInterval: 1000,
    onSuccess(data) {
      gagueValue.set(data * 80);
    },
  });
  return (
    <div className="tw-title-sm md:tw-title-lg mb-2 inline-grid relative left-1">
      {updateTxRate.isFetched ? (
        <>
          <SpringCounter
            target={updateTxRate.data * 80}
            initialTarget={updateTxRate.data * 80}
            initialValue={updateTxRate.data * 80}
            format={formatNumber}
            springConfig={[3, 1, 1]}
            className="text-left col-start-1 row-start-1 text-transparent  bg-clip-text hero-stat-blue"
          ></SpringCounter>
          <span className="col-start-1 row-start-1 invisible pointer-events-none pr-[2px]">
            {getFigureSpacer(Math.floor(updateTxRate.data * 80))}
          </span>
        </>
      ) : (
        <>&nbsp;</>
      )}
    </div>
  );
}

function ICPTransactionRate() {
  const transactionRateQuery = useQuery(
    ["transactionRate"],
    transactionRateWithJitter,
    {
      refetchInterval: 1000,
    }
  );
  return (
    <>
      {transactionRateQuery.isFetched ? (
        formatNumber(transactionRateQuery.data)
      ) : (
        <>&nbsp;&nbsp;</>
      )}
    </>
  );
}

export const Facts = () => {
  const ethTxValue = useMotionValue(0);

  const stateSizeQuery = useQuery(["stateSize"], getBytesStored, {
    refetchInterval: 10000,
  });

  const globalData = useGlobalData();
  const xdrPrice = globalData["xdr-price"]["default"] as number;

  // const gaugeRot = useTransform(ethTxValue, [0, 300000], [20, 160]);
  const gaugeRot = useTransform(ethTxValue, [230000, 240000], [20, 160]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 md:gap-0 text-white mb-20 md:mb-30">
      {/***************************************************************/}
      <div className="text-center flex flex-col  md:px-10">
        <div className="flex-1">
          <img
            src={require("./blocks.webp").default}
            loading="lazy"
            alt=""
            className="w-[141px]"
          ></img>
          <div className="text-center mt-4">
            <TotalBlocks></TotalBlocks>
          </div>
          <div className="tw-heading-6">Blocks processed</div>
          <hr className="bg-white/20 w-52 mx-auto mt-4 mb-3" />
          <div className="tw-paragraph md:tw-lead-sm mb-3">
            <ParallelSubnets /> parallel subnets
          </div>
          <div className="tw-paragraph md:tw-lead-sm">
            <BlockThroughput></BlockThroughput> MB/s block throughput capacity
          </div>
        </div>
        <div className="mt-16">
          <h3 className="md:tw-heading-4 mb-4">Throughput</h3>
          <p className="tw-paragraph-sm text-white/60 mb-0">
            Capacity horizontally scales as subnet blockchains are seamlessly
            combined into one unified blockchain. Blocks and transactions per
            second are unbounded.
          </p>
        </div>
      </div>
      {/***************************************************************/}
      <div className="text-center flex flex-col md:px-10">
        <div className="flex-1">
          <div className="mx-auto w-full md:w-[372px] relative">
            <img
              src={require("./eth-eq-txs.webp").default}
              loading="lazy"
              alt=""
              className="w-full"
            ></img>
            <motion.div
              className="absolute transition-transform -bottom-2 md:bottom-1 -left-3 w-6 h-6 rounded-full backdrop-blur-2xl border-2 border-solid border-white/30 bg-white/30 hero-eth-tx-gauge"
              style={{
                rotate: gaugeRot,
              }}
            ></motion.div>
          </div>
          <div className="text-center -mt-[74px]">
            <EthEquivalentTxRate gagueValue={ethTxValue}></EthEquivalentTxRate>
          </div>
          <div className="tw-heading-6 inline-flex">
            ETH equivalent TX/s
            <Link
              href="https://wiki.internetcomputer.org/wiki/Not_all_transactions_are_equal"
              title="Read more: Not all transactions are equal"
              className="text-white hover:text-white-60 hover:no-underline flex items-center ml-2"
            >
              <InfoIcon className="w-4 h-4 md:w-6 md:h-6" />
            </Link>
          </div>
          <hr className="bg-white/20 w-52 mx-auto mt-4 mb-3" />
          <div className="tw-paragraph md:tw-lead-sm">
            <ICPTransactionRate /> Transactions/s
          </div>
        </div>

        <div className="mt-16">
          <h3 className="md:tw-heading-4 mb-4">Comparing Transactions</h3>
          <p className="tw-paragraph-sm text-white/60 mb-0">
            Transactions invoke "actor" canister smart contract computations,
            which subnet blockchains can run concurrently (yet
            deterministically).
          </p>
        </div>
      </div>
      {/***************************************************************/}
      <div className="text-center flex flex-col md:px-10 md:pt-20">
        <div className="flex-1">
          <CostSvg className="mb-2" />

          <div className="tw-lead-sm flex justify-center items-center gap-2">
            ICP Costs <span className="tw-lead-lg">$5</span> / GB / year
          </div>
        </div>

        <div className="mt-20">
          <h3 className="md:tw-heading-4 mb-4">Smart Contract Memory</h3>
          <p className="tw-paragraph-sm text-white/60 mb-0">
            Storing data in smart contract memory allows ICP dapps to
            dynamically access it without querying external sources or relying
            on centralized cloud storage.
          </p>
        </div>
      </div>
      {/***************************************************************/}
      <div className="text-center flex flex-col md:px-10 md:pt-40">
        <div className="flex-1">
          <img
            src={require("./instructions.webp").default}
            loading="lazy"
            alt=""
            className="w-[89px]"
          ></img>
          <div className="text-center mt-4 mb-2">
            <div className="text-transparent bg-clip-text hero-stat-red text-[30px] font-book md:tw-title-sm">
              $0.000000000000536
            </div>
          </div>
          <div className="tw-heading-6">Cost per instruction</div>
          <hr className="bg-white/20 w-52 mx-auto mt-4 mb-3" />
          <div className="tw-paragraph md:tw-lead-sm mb-3">
            44&rsquo; 760&rsquo; 000x more efficient than ETH
          </div>
          <div className="tw-paragraph md:tw-lead-sm">ETH - $0.00024</div>
        </div>
        <div className="mt-16">
          <h3 className="md:tw-heading-4 mb-4">Throughput</h3>
          <p className="tw-paragraph-sm text-white/60 mb-0">
            Capacity horizontally scales as subnet blockchains are seamlessly
            combined into one unified blockchain. Blocks and transactions per
            second are unbounded.
          </p>
        </div>
      </div>
    </div>
  );
};
