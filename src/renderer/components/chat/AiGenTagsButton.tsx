/**
 * TagSpaces - universal file and folder organizer
 * Copyright (C) 2024-present TagSpaces GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License (version 3) as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

import AppConfig from '-/AppConfig';
import TsButton, { TSButtonProps } from '-/components/TsButton';
import { AIProvider } from '-/components/chat/ChatTypes';
import { TabNames } from '-/hooks/EntryPropsTabsContextProvider';
import { useChatContext } from '-/hooks/useChatContext';
import { useEntryPropsTabsContext } from '-/hooks/useEntryPropsTabsContext';
import { useNotificationContext } from '-/hooks/useNotificationContext';
import { useOpenedEntryContext } from '-/hooks/useOpenedEntryContext';
import { useTaggingActionsContext } from '-/hooks/useTaggingActionsContext';
import { getDefaultAIProvider } from '-/reducers/settings';
import { TS } from '-/tagspaces.namespace';
import { ButtonPropsVariantOverrides } from '@mui/material/Button';
import { OverridableStringUnion } from '@mui/types';
import { extractFileExtension } from '@tagspaces/tagspaces-common/paths';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { AIIcon } from '../CommonIcons';

type Props = TSButtonProps & {
  variant?: OverridableStringUnion<
    'text' | 'outlined' | 'contained',
    ButtonPropsVariantOverrides
  >;
  fromDescription?: boolean;
};

function AiGenTagsButton(props: Props) {
  const { fromDescription, variant, style, disabled } = props;
  const { t } = useTranslation();
  const { setOpenedTab } = useEntryPropsTabsContext();
  const { openedEntry } = useOpenedEntryContext();
  const defaultAiProvider: AIProvider = useSelector(getDefaultAIProvider);
  const { generate, openedEntryModel, newChatMessage } = useChatContext();
  const { addTagsToFsEntry } = useTaggingActionsContext();
  const { showNotification } = useNotificationContext();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (
    !openedEntry ||
    !openedEntryModel ||
    ![
      ...AppConfig.aiSupportedFiletypes.text,
      ...AppConfig.aiSupportedFiletypes.image,
    ].includes(openedEntry.extension)
  ) {
    return null;
  }

  const ext = extractFileExtension(openedEntry.name).toLowerCase();

  function handleGenerationResults(response) {
    console.log('newOllamaMessage response:' + response);
    setIsLoading(false);
    if (response) {
      try {
        const regex = /\{([^}]+)\}/g;
        const tags: TS.Tag[] = [...response.matchAll(regex)].map((match) => ({
          title: match[1].trim().replace(/^,|,$/g, '').toLowerCase(),
          type: 'sidecar',
        }));
        addTagsToFsEntry(openedEntry, tags).then(() =>
          setOpenedTab(TabNames.propertiesTab, openedEntry),
        );
        showNotification(
          'Tags for ' + openedEntry.name + ' generated by an AI.',
        );
      } catch (e) {
        console.error('parse response ' + response, e);
      }
    }
  }

  return (
    <TsButton
      loading={isLoading}
      disabled={isLoading || disabled}
      tooltip="Uses currently configured AI model to generate tags for this file"
      startIcon={<AIIcon />}
      style={style}
      data-tid="generateTagsAITID"
      onClick={() => {
        setIsLoading(true);
        if (fromDescription && openedEntry.meta.description) {
          newChatMessage(
            openedEntry.meta.description,
            false,
            'user',
            'tags',
            defaultAiProvider.defaultTextModel,
            false,
            [],
            false,
          ).then((results) => handleGenerationResults(results));
        } else if (AppConfig.aiSupportedFiletypes.image.includes(ext)) {
          generate('image', 'tags').then((results) =>
            handleGenerationResults(results),
          );
        } else if (AppConfig.aiSupportedFiletypes.text.includes(ext)) {
          generate(ext === 'pdf' ? 'image' : 'text', 'tags').then((results) =>
            handleGenerationResults(results),
          );
        }
      }}
      variant={variant}
    >
      {t(
        'core:' +
          (fromDescription ? 'generateTagsFromDescription' : 'generateTags'),
      )}
    </TsButton>
  );
}

export default AiGenTagsButton;
