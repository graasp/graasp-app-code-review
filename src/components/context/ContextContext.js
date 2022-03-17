import { createContext, useEffect } from 'react';
import { node } from 'prop-types';
import qs from 'qs';
import { hooks } from '../../config/queryClient';
import Loader from '../common/Loader';
import i18n from '../../config/i18n';
import { DEFAULT_LANG, DEFAULT_LOCAL_CONTEXT } from '../../config/settings';
import { showErrorToast } from '../../utils/toasts';

const Context = createContext();

const ContextProvider = ({ children }) => {
  const { itemId } = qs.parse(window.location.search, {
    ignoreQueryPrefix: true,
  });
  const {
    data: context,
    isLoading,
    isError,
  } = hooks.useGetLocalContext(itemId);

  useEffect(() => {
    // handle a change of language
    const lang = context?.get('lang') ?? DEFAULT_LANG;
    if (i18n.lang !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [context]);

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    showErrorToast('An error occured while fetching the context.');
  }

  const value = context ?? DEFAULT_LOCAL_CONTEXT;

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

ContextProvider.propTypes = {
  children: node,
};

ContextProvider.defaultProps = {
  children: null,
};

export { Context, ContextProvider };
