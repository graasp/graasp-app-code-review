import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import StudentView from './StudentView';
import { DEFAULT_VIEW, FEEDBACK_VIEW } from '../../../config/views';
import { getActions, getAppInstanceResources } from '../../../actions';
import Loader from '../../common/Loader';

class StudentMode extends Component {
  static propTypes = {
    appInstanceId: PropTypes.string,
    view: PropTypes.string,
    ready: PropTypes.bool.isRequired,
    dispatchGetAppInstanceResources: PropTypes.func.isRequired,
    dispatchGetActions: PropTypes.func.isRequired,
    userId: PropTypes.string,
  };

  static defaultProps = {
    view: 'normal',
    appInstanceId: null,
    userId: null,
  };

  componentDidMount() {
    const { userId, dispatchGetAppInstanceResources, dispatchGetActions } =
      this.props;

    // by default get the resources for this user
    dispatchGetAppInstanceResources({ userId });
    // by default get all actions for this user
    dispatchGetActions({ userId: [userId] });
  }

  componentDidUpdate({ appInstanceId: prevAppInstanceId }) {
    const { appInstanceId, dispatchGetAppInstanceResources, userId } =
      this.props;
    // handle receiving the app instance id
    if (appInstanceId !== prevAppInstanceId) {
      dispatchGetAppInstanceResources({ userId });
    }
  }

  render() {
    const { view, ready } = this.props;
    if (!ready) {
      return <Loader />;
    }
    switch (view) {
      case FEEDBACK_VIEW:
      case DEFAULT_VIEW:
      default:
        return <StudentView />;
    }
  }
}
const mapStateToProps = ({ context, appInstanceResources }) => {
  const { userId, appInstanceId } = context;
  return {
    userId,
    appInstanceId,
    ready: appInstanceResources.ready,
  };
};

const mapDispatchToProps = {
  dispatchGetAppInstanceResources: getAppInstanceResources,
  dispatchGetActions: getActions,
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(StudentMode);

export default ConnectedComponent;
