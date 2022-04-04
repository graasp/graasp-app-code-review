import React from 'react';
import { Dialog, DialogActions, DialogTitle } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

function getModalStyle(anchor) {
  // apply styling when ref is not null
  if (anchor.current) {
    const { top = 0 } = anchor.current.getBoundingClientRect();
    return {
      position: 'fixed',
      top: `${top - 10}px`,
    };
  }
  return {};
}

const ConfirmDialog = ({ open, setOpen, onClose, t, anchor }) => {
  const handleClose = (message) => {
    setOpen(false);
    onClose(message);
  };
  return (
    <Dialog
      open={open}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      PaperProps={{ style: getModalStyle(anchor) }}
    >
      <DialogTitle id="alert-dialog-title">
        {t('Are you sure you want to delete this comment?')}
      </DialogTitle>
      <DialogActions>
        <Button onClick={() => handleClose(false)} color="primary">
          {t('Cancel')}
        </Button>
        <Button onClick={() => handleClose(true)} color="primary" autoFocus>
          {t('Yes')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ConfirmDialog.propTypes = {
  t: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  anchor: PropTypes.shape({
    current: PropTypes.shape({
      getBoundingClientRect: PropTypes.func,
    }),
  }).isRequired,
};

export default withTranslation()(ConfirmDialog);
