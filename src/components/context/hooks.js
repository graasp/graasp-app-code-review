import { useContext } from 'react';
import { TokenContext } from './TokenContext';
import { Context } from './ContextContext';
import { hooks } from '../../config/queryClient';

export const useAppData = () => {
  const context = useContext(Context);
  const token = useContext(TokenContext);
  const query = hooks.useAppData({ token, itemId: context?.get('itemId') });
  return query;
};

export const useAppSettings = () => {
  const context = useContext(Context);
  const token = useContext(TokenContext);
  const query = hooks.useAppSettings({ token, itemId: context?.get('itemId') });
  return query;
};

export const useAppContext = () => {
  const context = useContext(Context);
  const token = useContext(TokenContext);
  const query = hooks.useAppContext({ token, itemId: context?.get('itemId') });
  return query;
};
