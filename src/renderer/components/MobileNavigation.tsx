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
import {
  AccountIcon,
  AddExistingFileIcon,
  AudioFileIcon,
  CreateFileIcon,
  HTMLFileIcon,
  HelpIcon,
  LinkFileIcon,
  LocalLocationIcon,
  MarkdownFileIcon,
  NewFileIcon,
  NewFolderIcon,
  OpenLinkIcon,
  OpenNewWindowIcon,
  RecentThingsIcon,
  SettingsIcon,
  TagLibraryIcon,
  ThemingIcon,
} from '-/components/CommonIcons';
import CustomLogo from '-/components/CustomLogo';
import HelpFeedbackPanel from '-/components/HelpFeedbackPanel';
import { ProLabel } from '-/components/HelperComponents';
import InfoIcon from '-/components/InfoIcon';
import LocationManager from '-/components/LocationManager';
import ProTeaser from '-/components/ProTeaser';
import StoredSearches from '-/components/StoredSearches';
import TagLibrary from '-/components/TagLibrary';
import Tooltip from '-/components/Tooltip';
import TsButton from '-/components/TsButton';
import TsIconButton from '-/components/TsIconButton';
import TsMenuList from '-/components/TsMenuList';
import UserDetailsPopover from '-/components/UserDetailsPopover';
import { useCreateDirectoryDialogContext } from '-/components/dialogs/hooks/useCreateDirectoryDialogContext';
import { useCreateEditLocationDialogContext } from '-/components/dialogs/hooks/useCreateEditLocationDialogContext';
import { useDownloadUrlDialogContext } from '-/components/dialogs/hooks/useDownloadUrlDialogContext';
import { useLinkDialogContext } from '-/components/dialogs/hooks/useLinkDialogContext';
import { useNewAudioDialogContext } from '-/components/dialogs/hooks/useNewAudioDialogContext';
import { useNewFileDialogContext } from '-/components/dialogs/hooks/useNewFileDialogContext';
import { useSettingsDialogContext } from '-/components/dialogs/hooks/useSettingsDialogContext';
import { useCurrentLocationContext } from '-/hooks/useCurrentLocationContext';
import { useDirectoryContentContext } from '-/hooks/useDirectoryContentContext';
import { useFileUploadContext } from '-/hooks/useFileUploadContext';
import { usePanelsContext } from '-/hooks/usePanelsContext';
import { useUserContext } from '-/hooks/useUserContext';
import { Pro } from '-/pro';
import { AppDispatch } from '-/reducers/app';
import {
  actions as SettingsActions,
  getKeyBindingObject,
} from '-/reducers/settings';
import { createNewInstance } from '-/services/utils-io';
import { ClickAwayListener } from '@mui/base/ClickAwayListener';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Divider } from '@mui/material';
import Box from '@mui/material/Box';
import ButtonGroup from '@mui/material/ButtonGroup';
import Grow from '@mui/material/Grow';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Popover from '@mui/material/Popover';
import Popper from '@mui/material/Popper';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { alpha, styled, useTheme } from '@mui/material/styles';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

const PREFIX = 'MobileNavigation';

const classes = {
  button: `${PREFIX}-button`,
  selectedButton: `${PREFIX}-selectedButton`,
};

const Root = styled(Box)(({ theme }) => ({
  [`& .${classes.button}`]: {
    padding: 8,
    margin: 0,
  },
  [`& .${classes.selectedButton}`]: {
    backgroundColor: theme.palette.primary.light,
  },
}));

interface Props {
  hideDrawer?: () => void;
  width?: number;
}

function MobileNavigation(props: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch: AppDispatch = useDispatch();
  const { setSelectedLocation, findLocation } = useCurrentLocationContext();
  const { currentDirectoryPath } = useDirectoryContentContext();
  const { openFileUpload } = useFileUploadContext();
  const { openCreateEditLocationDialog } = useCreateEditLocationDialogContext();
  const { openCreateDirectoryDialog } = useCreateDirectoryDialogContext();
  const { openNewFileDialog } = useNewFileDialogContext();
  const { openNewAudioDialog } = useNewAudioDialogContext();
  const { openSettingsDialog } = useSettingsDialogContext();
  const { openLinkDialog } = useLinkDialogContext();
  const { currentOpenedPanel, showPanel } = usePanelsContext();
  const { openDownloadUrl } = useDownloadUrlDialogContext();
  const keyBindings = useSelector(getKeyBindingObject);
  const { currentUser } = useUserContext();
  const [showTeaserBanner, setShowTeaserBanner] = useState<boolean>(true);
  const [anchorUser, setAnchorUser] = useState<HTMLButtonElement | null>(null);
  const showProTeaser = !Pro && showTeaserBanner;
  const { hideDrawer, width } = props;
  const switchTheme = () => dispatch(SettingsActions.switchTheme());
  const [openedCreateMenu, setOpenCreateMenu] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const currentLocation = findLocation();

  const handleToggle = () => {
    setOpenCreateMenu((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpenCreateMenu(false);
  };

  return (
    <Root
      style={{
        // backgroundColor: theme.palette.background.default,
        background: alpha(theme.palette.background.default, 0.85),
        backdropFilter: 'blur(5px)',
        height: '100%',
        overflow: 'hidden',
        width: width || 320,
        maxWidth: width || 320,
      }}
    >
      <Box
        style={{
          overflow: 'hidden',
          height: showProTeaser ? 'calc(100% - 186px)' : 'calc(100% - 55px)',
        }}
      >
        <Box>
          <CustomLogo />
          <Box style={{ width: '100%', textAlign: 'center' }}>
            <ButtonGroup
              ref={anchorRef}
              aria-label="split button"
              style={{
                textAlign: 'center',
              }}
            >
              <TsButton
                //tooltip={t('core:createNew')}
                aria-controls={
                  openedCreateMenu ? 'split-button-menu' : undefined
                }
                aria-expanded={openedCreateMenu ? 'true' : undefined}
                aria-haspopup="menu"
                data-tid="createNewDropdownButtonTID"
                onClick={handleToggle}
                startIcon={<CreateFileIcon />}
                style={{
                  borderRadius: 'unset',
                  borderTopLeftRadius: AppConfig.defaultCSSRadius,
                  borderBottomLeftRadius: AppConfig.defaultCSSRadius,
                }}
              >
                <Box
                  style={{
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    maxWidth: 100,
                  }}
                >
                  {t('core:createNew')}
                </Box>
              </TsButton>
              <TsButton
                tooltip={t('core:openSharingLink')}
                data-tid="openLinkNavigationTID"
                onClick={() => {
                  openLinkDialog();
                }}
                style={{
                  borderRadius: 'unset',
                  borderTopRightRadius: AppConfig.defaultCSSRadius,
                  borderBottomRightRadius: AppConfig.defaultCSSRadius,
                }}
                startIcon={<OpenLinkIcon />}
              >
                <Box
                  style={{
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    maxWidth: 100,
                  }}
                >
                  {t('core:openLink')}
                </Box>
              </TsButton>
            </ButtonGroup>
          </Box>
        </Box>

        <ClickAwayListener onClickAway={handleClose}>
          <Popper
            sx={{
              zIndex: 1,
            }}
            open={openedCreateMenu}
            anchorEl={anchorRef.current}
            role={undefined}
            transition
            disablePortal
          >
            {({ TransitionProps, placement }) => (
              <Grow
                {...TransitionProps}
                style={{
                  transformOrigin:
                    placement === 'bottom' ? 'center top' : 'center bottom',
                }}
              >
                <Paper>
                  <TsMenuList id="split-button-menu" autoFocusItem>
                    <MenuItem
                      key="navCreateNewTextFile"
                      data-tid="navCreateNewTextFileTID"
                      onClick={() => {
                        openNewFileDialog('txt');
                        setOpenCreateMenu(false);
                        if (hideDrawer) {
                          hideDrawer();
                        }
                      }}
                    >
                      <ListItemIcon>
                        <NewFileIcon />
                      </ListItemIcon>
                      <ListItemText primary={t('core:createTextFile')} />
                    </MenuItem>
                    <MenuItem
                      key="navCreateNewMarkdownFile"
                      data-tid="navCreateNewMarkdownFileTID"
                      onClick={() => {
                        openNewFileDialog('md');
                        setOpenCreateMenu(false);
                        if (hideDrawer) {
                          hideDrawer();
                        }
                      }}
                    >
                      <ListItemIcon>
                        <MarkdownFileIcon />
                      </ListItemIcon>
                      <ListItemText primary={t('core:createMarkdown')} />
                      <InfoIcon tooltip={t('core:createMarkdownTitle')} />
                    </MenuItem>
                    <MenuItem
                      key="navCreateHTMLTextFile"
                      data-tid="navCreateHTMLTextFileTID"
                      onClick={() => {
                        openNewFileDialog('html');
                        setOpenCreateMenu(false);
                        if (hideDrawer) {
                          hideDrawer();
                        }
                      }}
                    >
                      <ListItemIcon>
                        <HTMLFileIcon />
                      </ListItemIcon>
                      <ListItemText primary={t('core:createRichTextFile')} />
                      <InfoIcon tooltip={t('core:createNoteTitle')} />
                    </MenuItem>
                    <MenuItem
                      key="navCreateNewLinkFile"
                      data-tid="navCreateNewLinkFileTID"
                      onClick={() => {
                        openNewFileDialog('url');
                        setOpenCreateMenu(false);
                        if (hideDrawer) {
                          hideDrawer();
                        }
                      }}
                    >
                      <ListItemIcon>
                        <LinkFileIcon />
                      </ListItemIcon>
                      <ListItemText primary={t('core:createLinkFile')} />
                    </MenuItem>
                    <MenuItem
                      key="navCreateNewAudio"
                      data-tid="navCreateNewAudioTID"
                      disabled={!Pro}
                      onClick={() => {
                        openNewAudioDialog();
                        setOpenCreateMenu(false);
                        if (hideDrawer) {
                          hideDrawer();
                        }
                      }}
                    >
                      <ListItemIcon>
                        <AudioFileIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <>
                            {t('core:newAudioRecording')}
                            {!Pro && <ProLabel />}
                          </>
                        }
                      />
                    </MenuItem>
                    <Divider />
                    <MenuItem
                      key="addUploadFiles"
                      data-tid="addUploadFilesTID"
                      onClick={() => {
                        openFileUpload(currentDirectoryPath);
                        setOpenCreateMenu(false);
                        if (hideDrawer) {
                          hideDrawer();
                        }
                      }}
                    >
                      <ListItemIcon>
                        <AddExistingFileIcon />
                      </ListItemIcon>
                      <ListItemText primary={t('core:addFiles')} />
                    </MenuItem>
                    {AppConfig.isElectron &&
                      !currentLocation?.haveObjectStoreSupport() && (
                        <MenuItem
                          key="newFromDownloadURL"
                          data-tid="newFromDownloadURLTID"
                          onClick={() => {
                            openDownloadUrl();
                            setOpenCreateMenu(false);
                            if (hideDrawer) {
                              hideDrawer();
                            }
                          }}
                        >
                          <ListItemIcon>
                            <FileDownloadIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={t('core:newFromDownloadURL')}
                          />
                        </MenuItem>
                      )}
                    <Divider />
                    <MenuItem
                      key="createNewFolder"
                      data-tid="createNewFolderTID"
                      onClick={() => {
                        openCreateDirectoryDialog();
                        setOpenCreateMenu(false);
                        if (hideDrawer) {
                          hideDrawer();
                        }
                      }}
                    >
                      <ListItemIcon>
                        <NewFolderIcon />
                      </ListItemIcon>
                      <ListItemText primary={t('core:createDirectory')} />
                    </MenuItem>
                    <Divider />
                    <MenuItem
                      key="createNewLocation"
                      data-tid="createNewLocationTID"
                      onClick={() => {
                        setSelectedLocation(undefined);
                        openCreateEditLocationDialog();
                        setOpenCreateMenu(false);
                        if (hideDrawer) {
                          hideDrawer();
                        }
                      }}
                    >
                      <ListItemIcon>
                        <LocalLocationIcon />
                      </ListItemIcon>
                      <ListItemText primary={t('core:createLocation')} />
                    </MenuItem>
                    {!AppConfig.isCordova && (
                      <>
                        <MenuItem
                          key="createWindow"
                          data-tid="createWindowTID"
                          onClick={() => {
                            createNewInstance();
                            setOpenCreateMenu(false);
                          }}
                        >
                          <ListItemIcon>
                            <OpenNewWindowIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={t('core:newWindow')}
                          ></ListItemText>
                        </MenuItem>
                      </>
                    )}
                  </TsMenuList>
                </Paper>
              </Grow>
            )}
          </Popper>
        </ClickAwayListener>
        <LocationManager
          reduceHeightBy={140}
          show={currentOpenedPanel === 'locationManagerPanel'}
        />
        {currentOpenedPanel === 'tagLibraryPanel' && (
          <TagLibrary reduceHeightBy={140} />
        )}
        {currentOpenedPanel === 'searchPanel' && (
          <StoredSearches reduceHeightBy={140} />
        )}
        {currentOpenedPanel === 'helpFeedbackPanel' && (
          <HelpFeedbackPanel reduceHeightBy={150} />
        )}
      </Box>
      <Box
        style={{
          textAlign: 'center',
        }}
      >
        {showProTeaser && (
          <ProTeaser setShowTeaserBanner={setShowTeaserBanner} />
        )}
        <TsIconButton
          tooltip={t('core:settings')}
          id="verticalNavButton"
          data-tid="settings"
          onClick={() => {
            openSettingsDialog();
          }}
          style={{ marginTop: -15, marginRight: 2 }}
          size="large"
        >
          <SettingsIcon />
        </TsIconButton>
        <ToggleButtonGroup exclusive>
          <ToggleButton
            onClick={() => showPanel('locationManagerPanel')}
            className={
              currentOpenedPanel === 'locationManagerPanel'
                ? classNames(classes.button, classes.selectedButton)
                : classes.button
            }
            data-tid="locationManager"
            value="check"
          >
            <Tooltip
              title={t('core:locationManager')}
              keyBinding={keyBindings['showLocationManager']}
            >
              <LocalLocationIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton
            data-tid="tagLibrary"
            onClick={() => showPanel('tagLibraryPanel')}
            className={
              currentOpenedPanel === 'tagLibraryPanel'
                ? classNames(classes.button, classes.selectedButton)
                : classes.button
            }
            value="check"
          >
            <Tooltip
              title={t('core:tagLibrary')}
              keyBinding={keyBindings['showTagLibrary']}
            >
              <TagLibraryIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton
            data-tid="quickAccessButton"
            onClick={() => showPanel('searchPanel')}
            className={
              currentOpenedPanel === 'searchPanel'
                ? classNames(classes.button, classes.selectedButton)
                : classes.button
            }
            value="check"
          >
            <Tooltip title={t('core:quickAccess')}>
              <RecentThingsIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton
            data-tid="helpFeedback"
            onClick={() => showPanel('helpFeedbackPanel')}
            className={
              currentOpenedPanel === 'helpFeedbackPanel'
                ? classNames(classes.button, classes.selectedButton)
                : classes.button
            }
            value="check"
          >
            <Tooltip title={t('core:helpFeedback')}>
              <HelpIcon />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
        {currentUser ? (
          <>
            <TsIconButton
              tooltip={t('core:userAccount')}
              data-tid="accountCircleIconTID"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
                setAnchorUser(event.currentTarget)
              }
              style={{ marginTop: -15, marginRight: 2 }}
              size="large"
            >
              <AccountIcon />
            </TsIconButton>
            <Popover
              open={Boolean(anchorUser)}
              anchorEl={anchorUser}
              onClose={() => setAnchorUser(null)}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
            >
              <UserDetailsPopover onClose={() => setAnchorUser(null)} />
            </Popover>
          </>
        ) : (
          <TsIconButton
            tooltip={t('core:switchTheme')}
            data-tid="switchTheme"
            onClick={switchTheme}
            style={{ marginTop: -15, marginRight: 2 }}
            size="large"
          >
            <ThemingIcon />
          </TsIconButton>
        )}
      </Box>
    </Root>
  );
}
export default MobileNavigation;
