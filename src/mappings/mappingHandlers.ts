import { ExecuteSellingEvent, CollectionEvent, MintEvent } from "../types";
import {
  CosmosEvent,
  CosmosBlock,
  CosmosMessage,
  CosmosTransaction,
} from "@subql/types-cosmos";
import { Attribute } from "@cosmjs/stargate/build/logs";

const defaultResponse = {
  human_action: "",
  collection: "",
  token_id: "",
  price: 0,
  expires: "",
  seller: "",
  buyer: "",
  minter: "",
  owner: "",
  human_mint_type: "",
  time: 0
}

// export async function handleBlock(block: CosmosBlock): Promise<void> {
//   // If you wanted to index each block in Cosmos (Juno), you could do that here
//   const blockRecord = Block.create({
//     id: block.block.id,
//     blockHeight: BigInt(block.block.header.height),
//   });
//   await blockRecord.save();
// }

// export async function handleTransaction(tx: CosmosTransaction): Promise<void> {
//   const transactionRecord = Transaction.create({
//     id: tx.hash,
//     blockHeight: BigInt(tx.block.block.header.height),
//     timestamp: tx.block.block.header.time,
//   });
//   await transactionRecord.save();
// }

// export async function handleMessage(msg: CosmosMessage): Promise<void> {
//   const messageRecord = Message.create({
//     id: `${msg.tx.hash}-${msg.idx}`,
//     blockHeight: BigInt(msg.block.block.header.height),
//     txHash: msg.tx.hash,
//     sender: msg.msg.decodedMsg.sender,
//     contract: msg.msg.decodedMsg.contract,
//   });
//   await messageRecord.save();
// }

function createCollectionEvent(seller: String): CollectionEvent {
  const entity = new CollectionEvent(seller.toString());
  entity.amount = BigInt(0);
  return entity;
}

export async function handleSellingEvent(event: CosmosEvent): Promise<void> {
  const attr = event.event.attributes;
  const data = await parseAttributes(attr);
  const eventRecord = ExecuteSellingEvent.create({
    id: `${event.tx.hash}-${event.msg.idx}-${event.idx}`,
    blockHeight: BigInt(event.block.block.header.height),
    price: BigInt(data.price),
    txHash: event.tx.hash,
    action: data?.human_action,
    collection: data?.collection,
    tokenId: data?.token_id,
    time: BigInt(Math.floor(data.time)),
    seller: data?.seller,
    buyer: data?.buyer
  });

  // total sales of users
  let entity = await CollectionEvent.get(data.collection.toString());
  if (entity === undefined){
    entity = createCollectionEvent(data.collection.toString());
  }

  entity.amount = entity.amount + BigInt(data.price);

  await entity.save();
  await eventRecord.save();
}

export async function handleMintEvent(event: CosmosEvent): Promise<void> {
  const attr = event.event.attributes;
  const data = await parseAttributes(attr);
  const messageRecord = MintEvent.create({
    id: `${event.tx.hash}-${event.msg.idx}-${event.idx}`,
    blockHeight: BigInt(event.block.block.header.height),
    txHash: event.tx.hash,
    collection: data.collection,
    tokenId: data.token_id,
    minter: data.minter,
    owner: data.owner,
    time: BigInt(Math.floor(data.time)),
    random: (data.human_mint_type === "human_marketplace_admin_mint")? 1: 0
  });
  await messageRecord.save();
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
