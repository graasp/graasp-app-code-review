import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@material-ui/core';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { FLAG_REASON_EMPTY } from '../../config/settings';

function getModalStyle(anchor) {
  // apply styling when ref is not null
  if (anchor.current) {
    const { top = 0 } = anchor.current.getBoundingClientRect();
    return {
      position: 'fixed',
      top: `${top - 50}px`,
    };
  }
  return {};
}

const FormDialog = (props) => {
  const { t, open, title, content, handleClose, handleConfirm, anchor } = props;

  const [input, setInput] = useState('');

  const handleOnChange = (target) => {
    setInput(target.value);
  };

  const reasonEmpty = input === '';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{ style: getModalStyle(anchor) }}
    >
      <DialogTitle id="flag-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
        <TextField
          autoFocus
          fullWidth
          size="small"
          variant="outlined"
          label={t('Reason')}
          placeholder={`${t('Reason')}...`}
          value={input}
          onChange={({ target }) => handleOnChange(target)}
          helperText={reasonEmpty ? t(FLAG_REASON_EMPTY) : ' '}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined" color="secondary">
          {t('Cancel')}
        </Button>
        <Button
          disabled={reasonEmpty}
          onClick={() => handleConfirm(input)}
          variant="contained"
          color="primary"
        >
          {t('Send')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

FormDialog.propTypes = {
  t: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  title: PropTypes.string,
  content: PropTypes.string,
  handleClose: PropTypes.func.isRequired,
  handleConfirm: PropTypes.func.isRequired,
  anchor: PropTypes.shape({
    current: PropTypes.shape({
      getBoundingClientRect: PropTypes.func,
    }),
  }).isRequired,
};

FormDialog.defaultProps = {
  title: '',
  content: '',
};

export default withTranslation()(FormDialog);
