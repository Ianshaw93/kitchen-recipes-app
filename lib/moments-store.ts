import { parseTagsDocument, removeBehaviourTag, sortTagsNewestFirst, type BehaviourTag, type BehaviourTagsDocument } from "./behaviour-tags";
import { getDefaultBehaviourTagsStore, type BehaviourTagsStore } from "./behaviour-tags-store";
import { addMoment, migrateBehaviourExamples, type MomentDraft } from "./moments";
import { parseRelationshipDocument } from "./relationship";
import { getDefaultRelationshipStore, type RelationshipStore } from "./relationship-store";

export type MomentStores = {
  tags: BehaviourTagsStore;
  relationship: RelationshipStore;
};

function defaultStores(): MomentStores {
  return { tags: getDefaultBehaviourTagsStore(), relationship: getDefaultRelationshipStore() };
}

/**
 * Reads the moments, first copying in any household behaviour examples not yet migrated.
 * Safe to run on every request: it only writes when there is something new to copy, and it
 * only ever reads the household document.
 */
async function readMigrated(stores: MomentStores): Promise<BehaviourTagsDocument> {
  const document = parseTagsDocument(await stores.tags.read());
  const household = parseRelationshipDocument(await stores.relationship.read());
  if (!household) {
    return document;
  }
  const { document: migrated, changed } = migrateBehaviourExamples(document, household.behaviourExamples, new Date());
  if (changed) {
    await stores.tags.write(migrated);
  }
  return migrated;
}

export async function listSharedMoments(stores: MomentStores = defaultStores()): Promise<BehaviourTag[]> {
  return sortTagsNewestFirst((await readMigrated(stores)).tags);
}

export async function addSharedMoment(draft: MomentDraft, stores: MomentStores = defaultStores()): Promise<BehaviourTag> {
  const { document, moment } = addMoment(await readMigrated(stores), draft, {
    id: crypto.randomUUID(),
    now: new Date(),
  });
  await stores.tags.write(document);
  return moment;
}

export async function deleteSharedMoment(id: string, stores: MomentStores = defaultStores()): Promise<boolean> {
  const { document, removed } = removeBehaviourTag(await readMigrated(stores), id);
  if (removed) {
    await stores.tags.write(document);
  }
  return removed;
}
