import React from 'react';
import { Dialog, DialogActions, DialogTitle } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

const ConfirmDialog = ({ open, setOpen, onClose, t }) => {
  const handleClose = (message) => {
    setOpen(false);
    onClose(message);
  };
  return (
    <Dialog
      open={open}
      // onClose={handleClose('maybe')}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        {t('Are you sure you want to delete this comment ?')}
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
};

export default withTranslation()(ConfirmDialog);
