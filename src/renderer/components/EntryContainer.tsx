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

import AppConfig from '-/AppConfig';
import { CancelIcon, CloseEditIcon, SaveIcon } from '-/components/CommonIcons';
import { extractContainingDirectoryPath } from '@tagspaces/tagspaces-common/paths';
import EntryContainerNav from '-/components/EntryContainerNav';
import EntryContainerTabs from '-/components/EntryContainerTabs';
import EntryContainerTitle from '-/components/EntryContainerTitle';
import FileView from '-/components/FileView';
import Tooltip from '-/components/Tooltip';
import TsButton from '-/components/TsButton';
import AddRemoveTagsDialog from '-/components/dialogs/AddRemoveTagsDialog';
import ConfirmDialog from '-/components/dialogs/ConfirmDialog';
import { useResolveConflictContext } from '-/components/dialogs/hooks/useResolveConflictContext';
import { useCurrentLocationContext } from '-/hooks/useCurrentLocationContext';
import { useEntryPropsTabsContext } from '-/hooks/useEntryPropsTabsContext';
import { useFilePropertiesContext } from '-/hooks/useFilePropertiesContext';
import { useIOActionsContext } from '-/hooks/useIOActionsContext';
import { useNotificationContext } from '-/hooks/useNotificationContext';
import { useOpenedEntryContext } from '-/hooks/useOpenedEntryContext';
import { usePerspectiveActionsContext } from '-/hooks/usePerspectiveActionsContext';
import { Pro } from '-/pro';
import {
  getEntryContainerTab,
  getKeyBindingObject,
  isDesktopMode,
  isRevisionsEnabled,
} from '-/reducers/settings';
import { TS } from '-/tagspaces.namespace';
import LoadingButton from '@mui/lab/LoadingButton';
import { Switch, useMediaQuery } from '@mui/material';
import Box from '@mui/material/Box';
import ButtonGroup from '@mui/material/ButtonGroup';
import { useTheme } from '@mui/material/styles';
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { GlobalHotKeys } from 'react-hotkeys';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import EditFileButton from '-/components/EditFileButton';
import { useFullScreenContext } from '-/hooks/useFullScreenContext';

function EntryContainer() {
  const { t } = useTranslation();
  const {
    openedEntry,
    closeAllFiles,
    reloadOpenedFile,
    toggleEntryFullWidth,
    isEntryInFullWidth,
    fileChanged,
    setFileChanged,
  } = useOpenedEntryContext();
  const { setActions } = usePerspectiveActionsContext();
  const { toggleFullScreen } = useFullScreenContext();
  const { saveDescription, isEditMode, setEditMode } =
    useFilePropertiesContext();
  const { setAutoSave } = useIOActionsContext();
  const { findLocation } = useCurrentLocationContext();
  const { isEditable } = useEntryPropsTabsContext();
  const { saveFileOpen } = useResolveConflictContext();

  const { showNotification } = useNotificationContext();
  const tabIndex = useSelector(getEntryContainerTab);
  const keyBindings = useSelector(getKeyBindingObject);
  const desktopMode = useSelector(isDesktopMode);
  const revisionsEnabled = useSelector(isRevisionsEnabled);
  const theme = useTheme();
  const timer = useRef<NodeJS.Timeout>(null);

  const openedPanelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  };
  const [isPanelOpened, setPanelOpened] = useState<boolean>(
    tabIndex !== undefined && tabIndex !== -1,
  );

  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));

  // eslint-disable-next-line no-unused-vars
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0, undefined);
  const [
    isSaveBeforeCloseConfirmDialogOpened,
    setSaveBeforeCloseConfirmDialogOpened,
  ] = useState<boolean>(false);
  const [
    isSaveBeforeReloadConfirmDialogOpened,
    setSaveBeforeReloadConfirmDialogOpened,
  ] = useState<boolean>(false);
  const [isEditTagsModalOpened, setEditTagsModalOpened] =
    useState<boolean>(false);
  const isSavingInProgress = useRef<boolean>(false);
  const [entryPropertiesHeight, setEntryPropertiesHeight] =
    useState<number>(100);
  const fileViewer: MutableRefObject<HTMLIFrameElement> =
    useRef<HTMLIFrameElement>(null);
  const fileViewerContainer: MutableRefObject<HTMLDivElement> =
    useRef<HTMLDivElement>(null);
  const cLocation = findLocation(openedEntry.locationID);

  useEffect(() => {
    if (openedEntry && openedEntry.meta && openedEntry.meta.autoSave) {
      if (fileChanged) {
        timer.current = setInterval(() => {
          if (openedEntry.meta.autoSave && fileChanged) {
            startSavingFile();
            console.debug('autosave');
          }
        }, AppConfig.autoSaveInterval);
      } else if (timer.current) {
        clearInterval(timer.current);
      }
    } else if (timer.current) {
      clearInterval(timer.current);
    }
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    };
  }, [openedEntry, fileChanged]);

  // editor is not loaded in this time - change theme after loadDefaultTextContent
  useEffect(() => {
    try {
      if (
        fileViewer &&
        fileViewer.current &&
        fileViewer.current.contentWindow &&
        // @ts-ignore
        fileViewer.current.contentWindow.setTheme
      ) {
        // @ts-ignore call setContent from iframe
        fileViewer.current.contentWindow.setTheme(theme.palette.mode);
      }
    } catch (e) {
      console.log('Error setTheme', e);
    }
  }, [theme.palette.mode]); //settings.currentTheme

  /*  useEffect(() => {
    // if (openedEntrys.length > 0) {
    if (
      !firstRender &&
      // openedEntry.editMode &&
      // openedEntry.changed &&
      fileChanged.current
      // openedEntry.shouldReload === false
    ) {
      setSaveBeforeReloadConfirmDialogOpened(true);
    }
  }, [openedEntryPath.current, readOnlyMode]);*/

  // always open for dirs
  /*const isPropPanelVisible = openedEntry.isFile
    ? isPropertiesPanelVisible
    : true;*/

  const editingSupported: boolean =
    cLocation &&
    !cLocation.isReadOnly &&
    openedEntry &&
    openedEntry.editingExtensionId !== undefined &&
    openedEntry.editingExtensionId.length > 3;

  const handleMessage = (data: any) => {
    let message;
    let filePath;
    switch (data.command) {
      case 'showAlertDialog':
        message = data.title ? data.title : '';
        if (data.message) {
          message = message + ': ' + data.message;
        }
        showNotification(message);
        break;
      case 'saveDocument':
        savingFile(data.force !== undefined ? data.force : false);
        break;
      case 'parentSaveDocument':
        try {
          isSavingInProgress.current = true;
          forceUpdate();
          saveFileOpen(openedEntry, JSON.stringify(data.content)).then(
            (success) => {
              if (success) {
                setFileChanged(false);
                // showNotification(
                //   t('core:fileSavedSuccessfully'),
                //   NotificationTypes.default
                // );
              }
              // change state will not render DOT before file name too
              isSavingInProgress.current = false;
            },
          );
        } catch (e) {
          isSavingInProgress.current = false;
          console.debug('parentSaveDocument:', e);
        }
        break;
      case 'parentLoadTextContent':
        if (
          fileViewer &&
          fileViewer.current &&
          fileViewer.current.contentWindow
        ) {
          cLocation
            .loadTextFilePromise(openedEntry.path, false)
            .then((content) => {
              // Check and remove UTF-8 BOM
              const cleanedContent = content.startsWith('\uFEFF')
                ? content.slice(1)
                : content;
              fileViewer.current.contentWindow.postMessage(
                {
                  action: 'fileContent',
                  content: cleanedContent,
                  isEditMode: isEditMode,
                },
                '*',
              );
            });
        }
        break;
      case 'editDocument':
        if (editingSupported) {
          editOpenedFile();
        }
        break;
      case 'playbackEnded':
        openNextFileAction();
        break;
      // case 'openLinkExternally':
      //   // openLink(data.link);
      //   break;
      case 'loadDefaultTextContent':
        if (!openedEntry || !openedEntry.path) {
          // || openedEntry.changed) {
          break;
        }
        filePath = openedEntry.path;

        try {
          if (
            fileViewer &&
            fileViewer.current &&
            fileViewer.current.contentWindow &&
            // @ts-ignore
            fileViewer.current.contentWindow.setTheme
          ) {
            // @ts-ignore call setContent from iframe
            fileViewer.current.contentWindow.setTheme(theme.palette.mode);
          }
        } catch (e) {
          console.log('Error setTheme', e);
        }
        // TODO make loading index.html for folders configurable
        // if (!this.state.currentEntry.isFile) {
        //   textFilePath += '/index.html';
        // }
        cLocation
          .loadTextFilePromise(filePath, data.preview ? data.preview : false)
          .then((content) => {
            const UTF8_BOM = '\ufeff';
            if (content.indexOf(UTF8_BOM) === 0) {
              // eslint-disable-next-line no-param-reassign
              content = content.substr(1);
            }
            let fileDirectory = extractContainingDirectoryPath(
              filePath,
              cLocation?.getDirSeparator(),
            );
            if (AppConfig.isWeb) {
              const webDir = extractContainingDirectoryPath(
                // eslint-disable-next-line no-restricted-globals
                location.href,
                cLocation?.getDirSeparator(),
              );
              fileDirectory =
                (webDir && webDir !== '/' ? webDir + '/' : '') + fileDirectory;
            }
            if (
              fileViewer &&
              fileViewer.current &&
              fileViewer.current.contentWindow &&
              // @ts-ignore
              fileViewer.current.contentWindow.setContent
            ) {
              // @ts-ignore call setContent from iframe
              fileViewer.current.contentWindow.setContent(
                content,
                fileDirectory,
                !isEditMode,
                theme.palette.mode,
              );
            }
            return true;
          })
          .catch((err) => {
            console.log('Error loading text content ' + err);
          });
        break;
      case 'loadDefaultBinaryContent':
        if (!openedEntry || !openedEntry.path) {
          // || openedEntry.changed) {
          break;
        }
        filePath = openedEntry.path;

        cLocation
          .getFileContentPromise(filePath, 'arraybuffer')
          .then((content) => {
            let fileDirectory = extractContainingDirectoryPath(
              filePath,
              cLocation?.getDirSeparator(),
            );
            if (AppConfig.isWeb) {
              const webDir = extractContainingDirectoryPath(
                // eslint-disable-next-line no-restricted-globals
                location.href,
                cLocation?.getDirSeparator(),
              );
              fileDirectory =
                (webDir && webDir !== '/' ? webDir + '/' : '') + fileDirectory;
            }
            if (
              // @ts-ignore
              fileViewer?.current?.contentWindow?.setContent
            ) {
              // @ts-ignore
              fileViewer.current.contentWindow.setContent(
                content,
                fileDirectory,
                !isEditMode,
                theme.palette.mode,
              );
              //    return true;
            }
            // return true;
          })
          .catch((err) => {
            console.log('Error loading text content ' + err);
          });
        break;
      case 'contentChangedInEditor': {
        setFileChanged(true);
        break;
      }
      default:
        console.log(
          'Not recognized messaging command: ' + JSON.stringify(data),
        );
        break;
    }
  };

  const reloadDocument = () => {
    if (openedEntry) {
      if (isEditMode && fileChanged) {
        // openedEntry.changed) {
        setSaveBeforeReloadConfirmDialogOpened(true);
      } else {
        setEditMode(false);
        reloadOpenedFile();
      }
    }
  };

  const startClosingEntry = (event) => {
    if (event) {
      event.preventDefault(); // Let's stop this event.
      event.stopPropagation();
    }
    if (openedEntry && fileChanged && isEditMode) {
      // openedEntry.changed
      setSaveBeforeCloseConfirmDialogOpened(true);
    } else {
      closeFile();
    }
  };

  const closeFile = () => {
    closeAllFiles();
    // setEditingSupported(false);
  };

  const startSavingFile = () => {
    if (isEditMode) {
      savingFile();
    } else {
      saveDescription();
    }
  };

  const savingFile = (force = false) => {
    try {
      if (
        fileViewer &&
        fileViewer.current &&
        fileViewer.current.contentWindow &&
        // @ts-ignore
        fileViewer.current.contentWindow.getContent
      ) {
        // @ts-ignore
        const fileContent = fileViewer.current.contentWindow.getContent();
        //check if file is changed
        if (fileChanged || force) {
          isSavingInProgress.current = true;
          forceUpdate();
          saveFileOpen(openedEntry, fileContent).then((success) => {
            if (success) {
              setFileChanged(false);
              // showNotification(
              //   t('core:fileSavedSuccessfully'),
              //   NotificationTypes.default
              // );
            }
            // change state will not render DOT before file name too
            isSavingInProgress.current = false;
          });
        }
      }
    } catch (e) {
      isSavingInProgress.current = false;
      console.debug('function getContent not exist for file:', e);
    }
  };

  const editOpenedFile = () => {
    // addToEntryContainer(openedEntry);
    setEditMode(true);
  };

  /*const setPercent = (p: number | undefined) => {
    percent.current = p;
    // console.log('Percent ' + percent.current);
    if (p !== undefined) {
      bufferedSplitResize(() => {
        // Threshold >10% for automatically close Properties panel
        if (p <= 10) {
          // parseInt(defaultSplitSize, 10)) {
          closePanel();
        } else {
          if (entrySplitSize !== p + '%') {
            setEntryPropertiesSplitSize(p + '%');
          }
          openPanel();
        }
      });
    }
    forceUpdate();
  };*/

  const openPanel = () => {
    if (!isPanelOpened) {
      setPanelOpened(true);
    }
  };

  const toggleProperties = () => {
    setPanelOpened(!isPanelOpened);
  };
  const openNextFileAction = () => {
    const action: TS.PerspectiveActions = { action: 'openNext' };
    setActions(action);
    // window.dispatchEvent(new Event('next-file'));
  };

  const openPrevFileAction = () => {
    const action: TS.PerspectiveActions = { action: 'openPrevious' };
    setActions(action);
    //window.dispatchEvent(new Event('previous-file'));
  };

  /*const fileExtension =
    openedEntry &&
    extractFileExtension(openedEntry.path, cLocation?.getDirSeparator());
  const isEditable =
    !readOnlyMode &&
    openedEntry &&
    openedEntry.isFile &&
    AppConfig.editableFiles.includes(fileExtension);*/

  const toggleAutoSave = (event: React.ChangeEvent<HTMLInputElement>) => {
    const autoSave = event.target.checked;
    if (Pro) {
      setAutoSave(openedEntry, autoSave, openedEntry.locationID);
      /*switchLocationTypeByID(openedEntry.locationId).then(
        (currentLocationId) => {
          Pro.MetaOperations.saveFsEntryMeta(openedEntry.path, {
            autoSave,
          }).then((entryMeta) => {
            updateOpenedFile(openedEntry.path, entryMeta).then(() =>
              switchCurrentLocationType(),
            );
          });
        },
      );*/
    } else {
      showNotification(t('core:thisFunctionalityIsAvailableInPro'));
    }
  };

  const toggleEntryPropertiesHeight = () => {
    if (entryPropertiesHeight === 100) {
      setEntryPropertiesHeight(200);
    } else if (entryPropertiesHeight === 200) {
      setEntryPropertiesHeight(350);
    } else if (entryPropertiesHeight === 350) {
      setEntryPropertiesHeight(50);
    } else if (entryPropertiesHeight === 50) {
      setEntryPropertiesHeight(100);
    } else {
      setEntryPropertiesHeight(200);
    }
  };

  const tabs = () => {
    const autoSave = isEditable(openedEntry) && revisionsEnabled && (
      <Tooltip
        title={
          t('core:autosave') +
          (!Pro ? ' - ' + t('core:thisFunctionalityIsAvailableInPro') : '')
        }
      >
        <Switch
          data-tid="autoSaveTID"
          checked={openedEntry.meta && openedEntry.meta.autoSave}
          onChange={toggleAutoSave}
          name="autoSave"
        />
      </Tooltip>
    );

    let closeCancelIcon;
    if (desktopMode) {
      closeCancelIcon = fileChanged ? <CancelIcon /> : <CloseEditIcon />;
    }

    let editFile = null;
    if (editingSupported) {
      if (isEditMode) {
        editFile = (
          <ButtonGroup>
            <TsButton
              tooltip={t('core:cancelEditing')}
              data-tid="cancelEditingTID"
              onClick={() => {
                setEditMode(false);
                setFileChanged(false);
              }}
              style={{
                borderRadius: 'unset',
                borderTopLeftRadius: AppConfig.defaultCSSRadius,
                borderBottomLeftRadius: AppConfig.defaultCSSRadius,
                borderTopRightRadius: fileChanged
                  ? 0
                  : AppConfig.defaultCSSRadius,
                borderBottomRightRadius: fileChanged
                  ? 0
                  : AppConfig.defaultCSSRadius,
              }}
              aria-label={t('core:cancelEditing')}
              startIcon={closeCancelIcon}
            >
              {fileChanged ? t('core:cancel') : t('core:exitEditMode')}
            </TsButton>

            {fileChanged && (
              <Tooltip
                title={
                  t('core:saveFile') +
                  ' (' +
                  (AppConfig.isMacLike ? '⌘' : 'CTRL') +
                  ' + S)'
                }
              >
                <LoadingButton
                  disabled={false}
                  onClick={startSavingFile}
                  aria-label={t('core:saveFile')}
                  data-tid="fileContainerSaveFile"
                  size="small"
                  variant="outlined"
                  startIcon={desktopMode && <SaveIcon />}
                  loading={isSavingInProgress.current}
                  style={{
                    borderRadius: 'unset',
                    borderTopRightRadius: AppConfig.defaultCSSRadius,
                    borderBottomRightRadius: AppConfig.defaultCSSRadius,
                  }}
                >
                  {t('core:save')}
                </LoadingButton>
              </Tooltip>
            )}
          </ButtonGroup>
        );
      } else {
        editFile = <EditFileButton />;
      }
    }

    const tabsComponent = useCallback(
      (marginRight: string | undefined = undefined) => (
        <EntryContainerTabs
          isPanelOpened={isPanelOpened}
          openPanel={openPanel}
          toggleProperties={toggleProperties}
          marginRight={marginRight}
        />
      ),
      [isPanelOpened],
    );

    if (!autoSave && !editFile) {
      return tabsComponent();
    }

    return (
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
        }}
      >
        {tabsComponent('160px')}
        <div
          style={{
            zIndex: 1,
            position: 'absolute',
            right: 10,
            top: 8,
            backgroundColor: theme.palette.background.default,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {autoSave}
          {editFile}
        </div>
      </div>
    );
  };

  if (!openedEntry || openedEntry.path === undefined) {
    return <div>{t('core:noEntrySelected')}</div>;
  }

  return (
    <GlobalHotKeys
      handlers={{
        closeViewer: startClosingEntry,
        saveDocument: startSavingFile,
        editDocument: editOpenedFile,
        nextDocument: openNextFileAction,
        prevDocument: openPrevFileAction,
        reloadDocument: reloadDocument,
        deleteDocument: () => {}, // TODO move delete functionality from entry container menu
        openInFullWidth: toggleEntryFullWidth,
        toggleFullScreen: () => toggleFullScreen(fileViewerContainer.current),
      }}
      keyMap={{
        closeViewer: keyBindings.closeViewer,
        saveDocument: keyBindings.saveDocument,
        editDocument: keyBindings.editDocument,
        nextDocument: keyBindings.nextDocument,
        prevDocument: keyBindings.prevDocument,
        reloadDocument: keyBindings.reloadDocument,
        deleteDocument: keyBindings.deleteDocument,
        openInFullWidth: keyBindings.openInFullWidth,
        toggleFullScreen: keyBindings.toggleFullScreen,
      }}
    >
      <div
        style={{
          height: '100%',
          ...(isPanelOpened && openedPanelStyle),
        }}
      >
        <div
          style={{
            width: '100%',
            flexDirection: 'column',
            flex: '1 1 ' + entryPropertiesHeight + '%',
            display: 'flex',
            backgroundColor: theme.palette.background.default,
            overflow: 'hidden',
            marginBottom: 1,
          }}
        >
          <Box
            style={{
              paddingLeft: 0,
              paddingRight: 50,
              paddingTop: 0,
              minHeight: 48,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-start',
            }}
          >
            <EntryContainerTitle
              reloadDocument={reloadDocument}
              startClosingEntry={startClosingEntry}
              isEntryInFullWidth={isEntryInFullWidth}
              fileViewerContainer={fileViewerContainer.current}
              desktopMode={desktopMode}
              smallScreen={smallScreen}
            />
            <EntryContainerNav
              isFile={openedEntry.isFile}
              startClosingEntry={startClosingEntry}
              smallScreen={smallScreen}
            />
          </Box>
          {tabs()}
          {openedEntry.isFile && isPanelOpened && (
            <Tooltip title={t('core:togglePreviewSize')}>
              <div
                style={{
                  textAlign: 'center',
                  // maxHeight: 9,
                  minHeight: 8,
                  paddingTop: 2,
                  backgroundColor: theme.palette.background.default,
                  borderBottom: '1px solid ' + theme.palette.divider,
                  cursor: 's-resize',
                }}
                onClick={toggleEntryPropertiesHeight}
              >
                <div
                  style={{
                    width: '10%',
                    border: '1px dashed ' + theme.palette.text.secondary,
                    margin: '2px auto',
                  }}
                ></div>
              </div>
            </Tooltip>
          )}
        </div>
        {openedEntry.isFile && (
          <FileView
            key="FileViewID"
            fileViewer={fileViewer}
            fileViewerContainer={fileViewerContainer}
            height={tabIndex !== undefined ? '100%' : 'calc(100% - 100px)'}
            setSavingInProgress={(isSaving: boolean) => {
              isSavingInProgress.current = isSaving;
              forceUpdate();
            }}
            handleMessage={handleMessage}
          />
        )}
      </div>
      {isSaveBeforeCloseConfirmDialogOpened && (
        <ConfirmDialog
          open={isSaveBeforeCloseConfirmDialogOpened}
          onClose={() => {
            setSaveBeforeCloseConfirmDialogOpened(false);
          }}
          title={t('core:confirm')}
          content={t('core:saveFileBeforeClosingFile')}
          confirmCallback={(result) => {
            if (result) {
              startSavingFile();
            } else {
              closeFile();
              setSaveBeforeCloseConfirmDialogOpened(false);
            }
          }}
          cancelDialogTID="cancelSaveBeforeCloseDialog"
          confirmDialogTID="confirmSaveBeforeCloseDialog"
          confirmDialogContentTID="confirmDialogContent"
        />
      )}
      {isSaveBeforeReloadConfirmDialogOpened && (
        <ConfirmDialog
          open={isSaveBeforeReloadConfirmDialogOpened}
          onClose={() => {
            setSaveBeforeReloadConfirmDialogOpened(false);
          }}
          title={t('core:confirm')}
          content="File was modified, do you want to save the changes?"
          confirmCallback={(result) => {
            if (result) {
              setSaveBeforeReloadConfirmDialogOpened(false);
              startSavingFile();
            } else {
              setSaveBeforeReloadConfirmDialogOpened(false);
              setFileChanged(false);
            }
          }}
          cancelDialogTID="cancelSaveBeforeCloseDialog"
          confirmDialogTID="confirmSaveBeforeCloseDialog"
          confirmDialogContentTID="confirmDialogContent"
        />
      )}
      {isEditTagsModalOpened && (
        <AddRemoveTagsDialog
          open={isEditTagsModalOpened}
          onClose={() => setEditTagsModalOpened(false)}
          selected={
            openedEntry
              ? [cLocation.toFsEntry(openedEntry.path, openedEntry.isFile)]
              : []
          }
        />
      )}
    </GlobalHotKeys>
  );
}

export default EntryContainer;
