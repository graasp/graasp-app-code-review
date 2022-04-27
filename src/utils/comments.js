const findCommentWithId = (comments, commentId) =>
  comments.find((c) => c._id === commentId);
const findCommentWithParentId = (comments, commentId) =>
  comments.find((c) => c.data?.parent === commentId);

const getThreadIdsFromLastCommentId = (allComments, lastCommentId) => {
  // this method goes bottom up to find comment ids in the thread
  const thread = [];
  let parentId = lastCommentId;
  let parent = null;
  do {
    parent = findCommentWithId(allComments, parentId);
    if (parent) {
      thread.push(parentId);
      parentId = parent.data?.parent;
    }
  } while (parent);

  return thread;
};

const getThreadIdsFromFirstCommentId = (allComments, firstId) => {
  // this method goes from top to bottom
  let parentId = firstId;
  const thread = [firstId];
  let children = null;
  // find children to the comment
  do {
    children = findCommentWithParentId(allComments, parentId);
    if (children) {
      thread.push(children._id);
      parentId = children._id;
    }
  } while (children);
  return thread;
};

const getOrphans = (allComments) => {
  // orphans are comments which parent does not exist
  const orphans = [];
  allComments.forEach((c) => {
    const parentId = c.data?.parent;
    const parent = findCommentWithId(allComments, parentId);
    // comment is not on thread start but his parent is not found
    if (parentId && !parent) {
      orphans.push(c);
    }
  });
  return orphans;
};

export {
  findCommentWithId,
  findCommentWithParentId,
  getThreadIdsFromLastCommentId,
  getThreadIdsFromFirstCommentId,
  getOrphans,
};
