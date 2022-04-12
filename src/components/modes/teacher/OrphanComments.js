import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { Button } from '@material-ui/core';
import { COMMENT } from '../../../config/appInstanceResourceTypes';
import { deleteAppInstanceResource } from '../../../actions';

const OrphanComments = (props) => {
  const { comments } = props;

  const getOrphanComments = () => {
    const orphanCommentIds = [];
    comments.forEach((c) => {
      const parentId = c.data.parent;
      const parent = comments.find((p) => p._id === parentId);
      // comment is not on thread start but his parent is not found
      if (parentId && !parent) {
        orphanCommentIds.push(parent._id);
      }
    });
    console.log(orphanCommentIds);
    return orphanCommentIds;
  };

  const handleOnClickRemoveOrphans = (orphans) => {
    const { dispatchDeleteAppInstanceResource } = props;
    orphans.map((o) => dispatchDeleteAppInstanceResource(o._id));
  };

  const orphans = getOrphanComments();
  return (
    <>
      <div>Number of orphan comments : {orphans.length}</div>
      <Button onClick={() => handleOnClickRemoveOrphans(orphans)}>
        Remove orphans
      </Button>
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
  dispatchDeleteAppInstanceResource: PropTypes.func.isRequired,
};

OrphanComments.defaultProps = {
  comments: [],
};

const mapStateToProps = ({ appInstanceResources }) => ({
  comments: appInstanceResources.content.filter((r) => r.type === COMMENT),
});

const mapDispatchToProps = {
  dispatchDeleteAppInstanceResource: deleteAppInstanceResource,
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(OrphanComments);

export default withTranslation()(ConnectedComponent);
