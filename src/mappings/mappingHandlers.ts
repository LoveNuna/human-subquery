import { Block, ExecuteEvent, Message, Transaction } from "../types";
import {
  CosmosEvent,
  CosmosBlock,
  CosmosMessage,
  CosmosTransaction,
} from "@subql/types-cosmos";
import { Attribute } from "@cosmjs/stargate/build/logs";

const defaultResponse = {
  _contract_address: "",
  action: "",
  collection: "",
  token_id: "",
  price: "",
  expires: "",
  seller: "",
  buyer: ""
}

export async function handleBlock(block: CosmosBlock): Promise<void> {
  // If you wanted to index each block in Cosmos (Juno), you could do that here
  const blockRecord = Block.create({
    id: block.block.id,
    height: BigInt(block.block.header.height),
  });
  await blockRecord.save();
}

export async function handleTransaction(tx: CosmosTransaction): Promise<void> {
  const transactionRecord = Transaction.create({
    id: tx.hash,
    blockHeight: BigInt(tx.block.block.header.height),
    timestamp: tx.block.block.header.time,
  });
  await transactionRecord.save();
}

export async function handleMessage(msg: CosmosMessage): Promise<void> {
  const messageRecord = Message.create({
    id: `${msg.tx.hash}-${msg.idx}`,
    blockHeight: BigInt(msg.block.block.header.height),
    txHash: msg.tx.hash,
    sender: msg.msg.decodedMsg.sender,
    contract: msg.msg.decodedMsg.contract,
  });
  await messageRecord.save();
}

export async function handleEvent(event: CosmosEvent): Promise<void> {
  const attr = event.event.attributes;
  const data = await parseAttributes(attr);
  const eventRecord = ExecuteEvent.create({
    id: `${event.tx.hash}-${event.msg.idx}-${event.idx}`,
    blockHeight: BigInt(event.block.block.header.height),
    txHash: event.tx.hash,
    contractAddress: data?._contract_address,
    action: data?.action,
    collection: data?.collection,
    tokenId: data?.token_id,
    price: data?.price,
    expires: data?.expires,
    seller: data?.seller,
    buyer: data?.buyer
  });

  await eventRecord.save();
}

export const parseAttributes = async (
  attr: readonly Attribute[],
  // type: string,
  // defaultVal: any
) => {
  let data = defaultResponse;

  attr.map(({ key, value }) => {
    let obj = {};
    obj =  { [key]: value };
    // if (key === "action") {
    //   if ([type].includes(value)) {
    //     obj =  { [key]: value };
    //   }
    // }
    // else {
    //   obj = { [key]: value };
    // }
    data = { ...data, ...obj };
  });

  return data;
};
