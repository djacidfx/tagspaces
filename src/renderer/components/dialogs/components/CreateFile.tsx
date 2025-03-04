/**
 * TagSpaces - universal file and folder organizer
 * Copyright (C) 2017-present TagSpaces GmbH
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

import Tooltip from '-/components/Tooltip';
import TsTextField from '-/components/TsTextField';
import { useTargetPathContext } from '-/components/dialogs/hooks/useTargetPathContext';
import { fileNameValidation } from '-/services/utils-io';
import { TS } from '-/tagspaces.namespace';
import { FormControl } from '@mui/material';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import React, { useEffect, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  fileName: string;
  handleFileNameChange: (fileName: string) => void;
  handleFileContentChange: (fileContent: string) => void;
  createFile: (fileType: TS.FileType) => void;
  haveError: (error: boolean) => void;
  tidPrefix?: string;
  fileType?: TS.FileType;
}

function CreateFile(props: Props) {
  const {
    tidPrefix,
    fileType,
    createFile,
    fileName,
    handleFileNameChange,
    handleFileContentChange,
    haveError,
  } = props;
  const { t } = useTranslation();
  const { targetDirectoryPath } = useTargetPathContext();

  const [inputError, setInputError] = useState<boolean>(false);

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0, undefined);

  const noSuitableLocation = !targetDirectoryPath;

  useEffect(() => {
    haveError(inputError);
  }, [inputError]);

  function tid(tid) {
    if (tidPrefix) {
      return tidPrefix + tid;
    }
    return tid;
  }

  const onInputFocus = (event) => {
    if (fileName) {
      event.preventDefault();
      const { target } = event;
      target.focus();
      /*const indexOfBracket = fileName.current.indexOf(
        AppConfig.beginTagContainer
      );*/
      let endRange = fileName.length;
      // if (indexOfBracket > 0) {
      //   endRange = indexOfBracket;
      // }
      target.setSelectionRange(0, endRange);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileNameChange(event.target.value);
    handleValidation(event.target.value);
  };
  const handleContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileContentChange(event.target.value);
  };

  const handleValidation = (file) => {
    let noValid = fileNameValidation(file);

    if (noValid) {
      if (inputError !== noValid) {
        setInputError(noValid);
      } else {
        forceUpdate();
      }
    } else {
      setInputError(noValid);
    }
  };

  return (
    <Grid container spacing={1}>
      <FormControl fullWidth={true} error={inputError}>
        <TsTextField
          error={inputError}
          name="entryName"
          label={t('core:fileName')}
          onChange={handleInputChange}
          onFocus={onInputFocus}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.code === 'Enter') {
              event.preventDefault();
              event.stopPropagation();
              createFile(fileType);
            }
          }}
          defaultValue={fileName}
          disabled={noSuitableLocation}
          autoFocus
          data-tid={tid('newEntryDialogInputTID')}
        />
        {inputError && (
          <FormHelperText>{t('core:fileNameHelp')}</FormHelperText>
        )}
      </FormControl>
      {fileType ? (
        <FormControl fullWidth={true}>
          <TsTextField
            autoFocus
            id="fileContentID"
            label={t('core:fileContent')}
            multiline
            rows={5}
            onChange={handleContentChange}
          />
        </FormControl>
      ) : (
        <ButtonGroup style={{ margin: '0 auto' }}>
          <Button
            onClick={() => createFile('md')}
            data-tid={tid('createMarkdownButton')}
            disabled={noSuitableLocation}
          >
            <Tooltip title={t('createMarkdownTitle')}>
              <Typography
                variant="button"
                style={{ fontWeight: 'bold' }}
                display="block"
                gutterBottom
              >
                {t('createMarkdown')}
              </Typography>
            </Tooltip>
          </Button>
          <Button
            onClick={() => createFile('html')}
            data-tid={tid('createRichTextFileButton')}
            disabled={noSuitableLocation}
          >
            <Tooltip title={t('createNoteTitle')}>
              <Typography variant="button" display="block" gutterBottom>
                {t('createRichTextFile')}
              </Typography>
            </Tooltip>
          </Button>
          <Button
            onClick={() => createFile('txt')}
            data-tid={tid('createTextFileButton')}
            disabled={noSuitableLocation}
          >
            <Tooltip title={t('createTextFileTitle')}>
              <Typography variant="button" display="block" gutterBottom>
                {t('createTextFile')}
              </Typography>
            </Tooltip>
          </Button>
        </ButtonGroup>
      )}
    </Grid>
  );
}

export default CreateFile;
