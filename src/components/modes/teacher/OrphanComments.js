import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { Button, FormControlLabel, makeStyles } from '@material-ui/core';
import _ from 'lodash';
import { ALL_COMMENT_TYPES } from '../../../config/appInstanceResourceTypes';
import { deleteAppInstanceResource } from '../../../actions';
import {
  getOrphans,
  getThreadIdsFromFirstCommentId,
} from '../../../utils/comments';

const useStyles = makeStyles((theme) => ({
  button: {
    margin: theme.spacing(0, 1),
  },
}));

const OrphanComments = (props) => {
  const { comments, t } = props;
  const classes = useStyles();

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

  const buttonControl = (
    <Button
      className={classes.button}
      variant="outlined"
      color="secondary"
      onClick={() => handleOnClickRemoveOrphans(orphanThreads)}
      disabled={orphanThreads.length === 0}
    >
      {t('Remove orphans')}
    </Button>
  );
  const buttonLabel = `${t('Orphan threads')}: ${orphanThreads.length} (${_.sum(
    orphanThreads.map((thread) => thread.length),
  )} ${t('total comments')})`;

  return <FormControlLabel control={buttonControl} label={buttonLabel} />;
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
