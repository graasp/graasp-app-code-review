import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { Button, Typography } from '@material-ui/core';
import _ from 'lodash';
import { ALL_COMMENT_TYPES } from '../../../config/appInstanceResourceTypes';
import { deleteAppInstanceResource } from '../../../actions';
import {
  getOrphans,
  getThreadIdsFromFirstCommentId,
} from '../../../utils/comments';

const OrphanComments = (props) => {
  const { comments, t } = props;
  const getOrphanComments = (allComments) => {
    const orphans = getOrphans(allComments);
    const orphanThreads = orphans.map((o) =>
      getThreadIdsFromFirstCommentId(comments, o._id),
    );
    return orphanThreads;
  };

  const handleOnClickRemoveOrphans = (orphanThreads) => {
    const { dispatchDeleteAppInstanceResource } = props;
    orphanThreads.forEach((thread) => {
      thread.forEach((id) => {
        dispatchDeleteAppInstanceResource(id);
      });
    });
  };

  const orphanThreads = getOrphanComments(comments);

  if (!orphanThreads.length) {
    return null;
  }

  return (
    <>
      <Button
        variant="outlined"
        onClick={() => handleOnClickRemoveOrphans(orphanThreads)}
        disabled={orphanThreads.length === 0}
      >
        Remove orphans
      </Button>
      <Typography variant="caption">{`${t('Number of orphan threads')}: ${
        orphanThreads.length
      } (${_.sum(orphanThreads.map((thread) => thread.length))} ${t(
        'total comments',
      )})`}</Typography>
    </>
  );
};

OrphanComments.propTypes = {
  comments: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      data: PropTypes.shape({
        parent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      }),
    }),
  ),
  t: PropTypes.func.isRequired,
  dispatchDeleteAppInstanceResource: PropTypes.func.isRequired,
};

OrphanComments.defaultProps = {
  comments: [],
};

const mapStateToProps = ({ appInstanceResources }) => ({
  comments: appInstanceResources.content.filter((r) =>
    ALL_COMMENT_TYPES.includes(r.type),
  ),
});

const mapDispatchToProps = {
  dispatchDeleteAppInstanceResource: deleteAppInstanceResource,
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(OrphanComments);

export default withTranslation()(ConnectedComponent);
