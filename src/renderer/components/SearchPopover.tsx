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
  ArchiveIcon,
  AudioIcon,
  BookIcon,
  BookmarkIcon,
  CloseIcon,
  CreateFileIcon,
  DocumentIcon,
  EditIcon,
  EmailIcon,
  FileIcon,
  FolderIcon,
  InfoTooltipIcon,
  NoteIcon,
  PictureIcon,
  UntaggedIcon,
  VideoIcon,
} from '-/components/CommonIcons';
import { SidePanel, classes } from '-/components/SidePanels.css';
import TooltipTS from '-/components/Tooltip';
import TsButton from '-/components/TsButton';
import TsIconButton from '-/components/TsIconButton';
import TsTextField from '-/components/TsTextField';
import SaveSearchDialog from '-/components/dialogs/SaveSearchDialog';
import { useDirectoryContentContext } from '-/hooks/useDirectoryContentContext';
import { useLocationIndexContext } from '-/hooks/useLocationIndexContext';
import { useSavedSearchesContext } from '-/hooks/useSavedSearchesContext';
import {
  getMaxSearchResults,
  getShowUnixHiddenEntries,
  isDesktopMode,
} from '-/reducers/settings';
import { haveSearchFilters } from '-/services/search';
import { openURLExternally } from '-/services/utils-io';
import { TS } from '-/tagspaces.namespace';
import { parseGeoLocation, parseLatLon } from '-/utils/geo';
import Box from '@mui/material/Box';
import ButtonGroup from '@mui/material/ButtonGroup';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { mergeWithExtractedTags } from '@tagspaces/tagspaces-common/misc';
import Links from 'assets/links';
import React, { useReducer, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import TagsSelect from './TagsSelect';

interface Props {
  style?: any;
  hideDrawer?: () => void;
  onClose: () => void;
  textQuery: string;
  setTextQuery: (value: string) => void;
}

function SearchPopover(props: Props) {
  const { t } = useTranslation();
  const desktopMode = useSelector(isDesktopMode);
  const theme = useTheme();
  const {
    openCurrentDirectory,
    currentDirectoryPath,
    searchQuery,
    setSearchQuery,
    exitSearchMode,
  } = useDirectoryContentContext();
  const { searches } = useSavedSearchesContext();
  const { getIndex, isIndexing } = useLocationIndexContext();
  const [, forceUpdate] = useReducer((x) => x + 1, 0, undefined);
  const maxSearchResults = useSelector(getMaxSearchResults);
  const showUnixHiddenEntries = useSelector(getShowUnixHiddenEntries);
  const fileTypes = useRef<Array<string>>(
    searchQuery.fileTypes
      ? searchQuery.fileTypes
      : AppConfig.SearchTypeGroups.any,
  );

  const searchBoxing = searchQuery.searchBoxing
    ? searchQuery.searchBoxing
    : 'location';
  const searchType = searchQuery.searchType ? searchQuery.searchType : 'fuzzy';
  const lastModified = useRef<string>(
    searchQuery.lastModified ? searchQuery.lastModified : '',
  );
  const [saveSearchDialogOpened, setSaveSearchDialogOpened] =
    useState<TS.SearchQuery>(undefined);
  const [tagPlace, setTagPlace] = useState<string>(' ');
  const [tagPlaceHelper, setTagPlaceHelper] = useState<string>(' ');
  const tagTimePeriodFrom = searchQuery.tagTimePeriodFrom // useRef<number | null>(
    ? searchQuery.tagTimePeriodFrom
    : undefined;
  const tagTimePeriodTo = searchQuery.tagTimePeriodTo //useRef<number | null>(
    ? searchQuery.tagTimePeriodTo
    : undefined;
  const [tagPlaceLat, setTagPlaceLat] = useState<number | null>(null);
  const [tagPlaceLong, setTagPlaceLong] = useState<number | null>(null);
  // const [tagPlaceRadius, setTagPlaceRadius] = useState<number>(0);
  const forceIndexing = useRef<boolean>(
    searchQuery.forceIndexing ? searchQuery.forceIndexing : false,
  );
  const fileSize = useRef<string>(
    searchQuery.fileSize ? searchQuery.fileSize : '',
  );

  const handleFileTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
    const { value, name } = target;

    if (name === 'fileTypes') {
      const types = JSON.parse(value);
      fileTypes.current = types;
      setSearchQuery({
        ...searchQuery,
        searchBoxing: searchBoxing,
        fileTypes: types,
        showUnixHiddenEntries,
        executeSearch: false,
      });
    }
  };

  const handleFileSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
    const { value, name } = target;
    if (name === 'fileSize') {
      fileSize.current = value;
      setSearchQuery({
        ...searchQuery,
        searchBoxing: searchBoxing,
        fileSize: value,
        showUnixHiddenEntries,
        executeSearch: false,
      });
    }
  };

  const handleLastModifiedChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { target } = event;
    const { value, name } = target;

    if (name === 'lastModified') {
      lastModified.current = value;
      setSearchQuery({
        ...searchQuery,
        searchBoxing: searchBoxing,
        lastModified: value,
        showUnixHiddenEntries,
        executeSearch: false,
      });
    }
  };

  const handleSavedSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { target } = event;
    const { value } = target;
    const savedSearch = searches.find((search) => search.uuid === value);
    if (!savedSearch) {
      return true;
    }
    props.setTextQuery(savedSearch.textQuery ? savedSearch.textQuery : '');
    fileTypes.current = savedSearch.fileTypes;
    lastModified.current = savedSearch.lastModified;
    fileSize.current = savedSearch.fileSize;
    forceIndexing.current = savedSearch.forceIndexing;
    setSearchQuery({
      ...savedSearch,
      tagTimePeriodFrom: savedSearch.tagTimePeriodFrom,
      tagTimePeriodTo: savedSearch.tagTimePeriodTo,
      showUnixHiddenEntries,
    });
  };

  function removeTags(tagsArray, removeTagsArray) {
    // eslint-disable-next-line react/no-access-state-in-setstate
    return tagsArray.filter((tag) =>
      removeTagsArray.some((valueTag) => valueTag.title !== tag.title),
    );
  }

  const handleTagFieldChange = (name, value, reason) => {
    let sq;
    if (reason === 'remove-value') {
      if (name === 'tagsAND') {
        sq = {
          ...searchQuery,
          tagsAND: removeTags(searchQuery.tagsAND, value),
        };
      } else if (name === 'tagsNOT') {
        sq = {
          ...searchQuery,
          tagsNOT: removeTags(searchQuery.tagsNOT, value),
        };
      } else if (name === 'tagsOR') {
        sq = {
          ...searchQuery,
          tagsOR: removeTags(searchQuery.tagsOR, value),
        };
      }
    } else {
      // eslint-disable-next-line no-lonely-if
      if (name === 'tagsAND') {
        sq = { ...searchQuery, tagsAND: value };
      } else if (name === 'tagsNOT') {
        sq = { ...searchQuery, tagsNOT: value };
      } else if (name === 'tagsOR') {
        sq = { ...searchQuery, tagsOR: value };
      }
    }
    if (!haveSearchFilters(sq)) {
      clearSearch();
    } else {
      setSearchQuery({
        ...sq,
        searchBoxing: searchBoxing,
        showUnixHiddenEntries,
        executeSearch: false,
      });
    }
  };

  const handleSearchTermChange = (event) => {
    const { target } = event;
    const { value } = target;
    props.setTextQuery(value);
  };

  const handlePlaceChange = (event) => {
    const { target } = event;
    const { value } = target;
    let lat = null;
    let lng = null;
    let tagPHelper;

    const location = parseGeoLocation(value);
    if (location !== undefined) {
      ({ lat, lng } = location);
    } else {
      const latLon = parseLatLon(value);
      if (latLon) {
        ({ lat } = latLon);
        lng = latLon.lon;
      }
    }

    if (lat && lng) {
      tagPHelper = 'Place at lat: ' + lat + ' long: ' + lng;
    } else {
      tagPHelper = '';
    }
    setTagPlace(value);
    setTagPlaceLat(lat);
    setTagPlaceLong(lng);
    setTagPlaceHelper(tagPHelper);
  };

  const startSearch = (event) => {
    if (event.key === 'Enter' || event.keyCode === 13) {
      if (props.hideDrawer) {
        props.hideDrawer();
      }
      executeSearch();
    }
  };

  const clearSearch = () => {
    props.setTextQuery('');
    fileTypes.current = AppConfig.SearchTypeGroups.any;
    lastModified.current = '';
    setTagPlace(' ');
    setTagPlaceHelper(' ');
    setTagPlaceLat(null);
    setTagPlaceLong(null);
    forceIndexing.current = false;
    fileSize.current = '';
    props.onClose();
    openCurrentDirectory().then(() => {
      setSearchQuery({});
      exitSearchMode();
    });
  };

  const saveSearch = (isNew = true) => {
    const tagsAND = mergeWithExtractedTags(
      props.textQuery,
      searchQuery.tagsAND,
      '+',
    );
    const tagsOR = mergeWithExtractedTags(
      props.textQuery,
      searchQuery.tagsOR,
      '|',
    );
    const tagsNOT = mergeWithExtractedTags(
      props.textQuery,
      searchQuery.tagsNOT,
      '-',
    );
    setSaveSearchDialogOpened({
      uuid: isNew ? undefined : searchQuery.uuid,
      title: searchQuery.title,
      textQuery: props.textQuery,
      tagsAND,
      tagsOR,
      tagsNOT,
      searchBoxing: searchBoxing,
      searchType: searchType,
      fileTypes: fileTypes.current,
      lastModified: lastModified.current,
      fileSize: fileSize.current,
      tagTimePeriodFrom: tagTimePeriodFrom,
      tagTimePeriodTo: tagTimePeriodTo,
      tagPlaceLat,
      tagPlaceLong,
      // tagPlaceRadius,
      maxSearchResults: maxSearchResults,
      currentDirectory: currentDirectoryPath,
      forceIndexing: forceIndexing.current,
    });
  };

  const switchSearchBoxing = (
    event: React.MouseEvent<HTMLElement>,
    boxing: 'location' | 'folder' | 'global',
  ) => {
    if (boxing !== null) {
      setSearchQuery({
        ...searchQuery,
        searchBoxing: boxing,
        executeSearch: false,
      });
    }
  };

  const switchSearchType = (
    event: React.MouseEvent<HTMLElement>,
    type: 'fuzzy' | 'semistrict' | 'strict',
  ) => {
    if (type !== null) {
      setSearchQuery({
        ...searchQuery,
        searchType: type,
        executeSearch: false,
      });
    }
  };

  const executeSearch = () => {
    const tagsAND = mergeWithExtractedTags(
      props.textQuery,
      searchQuery.tagsAND,
      '+',
    );
    const tagsOR = mergeWithExtractedTags(
      props.textQuery,
      searchQuery.tagsOR,
      '|',
    );
    const tagsNOT = mergeWithExtractedTags(
      props.textQuery,
      searchQuery.tagsNOT,
      '-',
    );
    const query: TS.SearchQuery = {
      textQuery: props.textQuery,
      tagsAND,
      tagsOR,
      tagsNOT,
      searchBoxing: searchBoxing,
      searchType: searchType,
      fileTypes: fileTypes.current,
      lastModified: lastModified.current,
      fileSize: fileSize.current,
      tagTimePeriodFrom: tagTimePeriodFrom,
      tagTimePeriodTo: tagTimePeriodTo,
      tagPlaceLat,
      tagPlaceLong,
      // tagPlaceRadius,
      maxSearchResults: maxSearchResults,
      currentDirectory: currentDirectoryPath,
      forceIndexing: forceIndexing.current,
      showUnixHiddenEntries,
      executeSearch: true,
    };
    console.log('Search object: ' + JSON.stringify(searchQuery));
    setSearchQuery(query);
    props.onClose();
  };

  const indexStatus = getIndex()
    ? '(' + getIndex().length + ' indexed entries)'
    : t('core:indexEmpty');
  return (
    <SidePanel
      style={{
        maxWidth: 400,
        height: '100%',
        // @ts-ignore
        WebkitAppRegion: 'no-drag',
      }}
    >
      <div className={classes.toolbar}>
        <Typography variant="button" style={{ margin: '12px 0 10px 10px' }}>
          {t('core:advancedSearch')}
        </Typography>
        <Typography
          variant="caption"
          className={classes.header}
          style={{ flex: 1, margin: 'auto', paddingLeft: 10 }}
        >
          {indexStatus}
        </Typography>
        <TsIconButton
          style={{ marginLeft: 'auto', height: 40 }}
          data-tid="closeSearchTID"
          onClick={props.onClose}
        >
          <CloseIcon />
        </TsIconButton>
      </div>
      <div
        style={{
          paddingTop: 0,
          paddingLeft: 10,
          paddingRight: 10,
          marginTop: 0,
          height: 'calc(100% - 90px)',
          maxHeight: 'calc(100% - 90px)',
          overflowX: 'hidden',
          overflowY: 'auto',
          scrollbarGutter: 'stable',
        }}
        data-tid="searchAdvancedTID"
      >
        <Grid
          container
          spacing={2}
          style={{ marginBottom: 15 }}
          direction="row"
          justifyContent="center"
          alignItems="flex-end"
        >
          <Grid item xs={9}>
            <TooltipTS title={t('storedSearchQueriesTooltip')}>
              <FormControl
                variant="outlined"
                style={{ width: '100%', marginTop: 6 }}
              >
                <FormHelperText style={{ marginLeft: 0 }}>
                  {t('core:savedSearchesTitle')}
                </FormHelperText>
                <Select
                  name="savedSearch"
                  labelId="saved-searches"
                  disabled={isIndexing !== undefined}
                  size={desktopMode ? 'small' : 'medium'}
                  onChange={handleSavedSearchChange}
                  displayEmpty
                  fullWidth
                  variant="outlined"
                  value={searchQuery.uuid ? searchQuery.uuid : -1}
                >
                  <MenuItem value={-1} style={{ display: 'none' }} />
                  {searches.length < 1 && (
                    <MenuItem>{t('noSavedSearches')}</MenuItem>
                  )}
                  {searches.map((search) => (
                    <MenuItem key={search.uuid} value={search.uuid}>
                      <span style={{ width: '100%' }}>{search.title}</span>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </TooltipTS>
          </Grid>
          <Grid
            item
            xs={3}
            style={{ display: 'flex', alignSelf: 'center', paddingTop: 40 }}
          >
            <ButtonGroup
              style={{
                textAlign: 'center',
                width: '100%',
              }}
            >
              {searchQuery.uuid && (
                <TsIconButton
                  tooltip={t('editSavedSearchTitle')}
                  data-tid="editSearchBtnTID"
                  onClick={() => saveSearch(false)}
                >
                  <EditIcon />
                </TsIconButton>
              )}
              <TsIconButton
                tooltip={t('createNewSavedSearchTitle')}
                data-tid="addSearchBtnTID"
                onClick={() => saveSearch()}
              >
                <CreateFileIcon />
              </TsIconButton>
            </ButtonGroup>
          </Grid>
          <Grid item xs={12}>
            <TsTextField
              id="searchTerm"
              label={t('core:searchQueryInfo')}
              value={props.textQuery}
              onChange={handleSearchTermChange}
              size={desktopMode ? 'small' : 'medium'}
              onKeyDown={startSearch}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <TooltipTS
                        title={
                          <>
                            <Typography variant="subtitle1" color="inherit">
                              Tips for the extended search
                            </Typography>
                            <Typography variant="subtitle2" color="inherit">
                              💡 <b>{'sun'}</b> - will match entries having the
                              word sun but also san or sum in the name
                              <br />
                              💡 <b>{'=sun'}</b> - will match entries having
                              exactly the word sun in the name
                              <br />
                              💡 <b>{'"sun and beach"'}</b> - will match entries
                              having `sun and beach´ in the name
                              <br />
                              💡 <b>{"'sun 'beach"}</b> - will match entries
                              having sun or beach in the name
                              <br />
                              💡 <b>{'!sun'}</b> - will match entries which do
                              not contain sun
                              <br />
                              💡 <b>{'^sun'}</b> - will match entries beginning
                              with sun
                              <br />
                              💡 <b>{'!^sun'}</b> - will match entries witch do
                              not begin with sun
                              <br />
                              💡 <b>{'.pdf$'}</b> - will match entries ending
                              with .pdf
                              <br />
                              💡 <b>{'!.pdf$'}</b> - will match entries not
                              ending with .pdf
                              <br />
                            </Typography>
                          </>
                        }
                      >
                        <InfoTooltipIcon />
                      </TooltipTS>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
        </Grid>
        <FormControl
          className={classes.formControl}
          disabled={isIndexing !== undefined}
        >
          <ToggleButtonGroup
            onChange={switchSearchBoxing}
            size="small"
            exclusive
            style={{ marginBottom: 10, alignSelf: 'center' }}
            value={searchBoxing}
          >
            <ToggleButton value="location">
              <TooltipTS title={t('searchPlaceholder')}>
                <div>{t('location')}</div>
              </TooltipTS>
            </ToggleButton>
            <ToggleButton value="folder">
              <TooltipTS title={t('searchCurrentFolderWithSubFolders')}>
                <div>{t('folder')}</div>
              </TooltipTS>
            </ToggleButton>
            <ToggleButton value="global">
              <TooltipTS title={t('searchInAllLocationTooltip')}>
                <div>{t('globalSearch')}</div>
              </TooltipTS>
            </ToggleButton>
          </ToggleButtonGroup>
        </FormControl>
        <FormControl
          className={classes.formControl}
          disabled={isIndexing !== undefined}
        >
          <ToggleButtonGroup
            onChange={switchSearchType}
            size="small"
            exclusive
            style={{ marginBottom: 10, alignSelf: 'center' }}
            value={searchType}
          >
            <ToggleButton value="fuzzy" data-tid="fuzzySearchTID">
              <TooltipTS title={t('searchTypeFuzzyTooltip')}>
                <div>{t('searchTypeFuzzy')}</div>
              </TooltipTS>
            </ToggleButton>
            <ToggleButton value="semistrict" data-tid="semiStrictSearchTID">
              <TooltipTS title={t('searchTypeSemiStrictTooltip')}>
                <div>{t('searchTypeSemiStrict')}</div>
              </TooltipTS>
            </ToggleButton>
            <ToggleButton value="strict" data-tid="strictSearchTID">
              <TooltipTS title={t('searchTypeStrictTooltip')}>
                <div>{t('searchTypeStrict')}</div>
              </TooltipTS>
            </ToggleButton>
          </ToggleButtonGroup>
        </FormControl>
        <FormControl
          className={classes.formControl}
          disabled={isIndexing !== undefined}
        >
          <ToggleButtonGroup
            onChange={() => {
              forceIndexing.current = !forceIndexing.current;
              forceUpdate();
            }}
            size="small"
            exclusive
            style={{ marginBottom: 10, alignSelf: 'center' }}
            value={forceIndexing.current}
          >
            <ToggleButton value={false}>
              <TooltipTS title={t('useCurrentIndexTooltip')}>
                <div>{t('useCurrentIndex')}</div>
              </TooltipTS>
            </ToggleButton>
            <ToggleButton value={true} data-tid="forceIndexingTID">
              <TooltipTS title={t('forceReindexTooltip')}>
                <div>{t('forceReindex')}</div>
              </TooltipTS>
            </ToggleButton>
          </ToggleButtonGroup>
        </FormControl>
        <FormControl
          className={classes.formControl}
          disabled={isIndexing !== undefined}
        >
          <TagsSelect
            dataTid="searchTagsAndTID"
            placeholderText={t('core:selectTags')}
            label={t('core:mustContainTheseTags')}
            tags={searchQuery.tagsAND}
            handleChange={handleTagFieldChange}
            tagSearchType="tagsAND"
            tagMode="remove"
          />
        </FormControl>
        <FormControl
          className={classes.formControl}
          disabled={isIndexing !== undefined}
        >
          <TagsSelect
            dataTid="searchTagsOrTID"
            placeholderText={t('core:selectTags')}
            tags={searchQuery.tagsOR}
            label={t('core:atLeastOneOfTheseTags')}
            handleChange={handleTagFieldChange}
            tagSearchType="tagsOR"
            tagMode="remove"
          />
        </FormControl>
        <FormControl
          className={classes.formControl}
          disabled={isIndexing !== undefined}
        >
          <TagsSelect
            dataTid="searchTagsNotTID"
            placeholderText={t('core:selectTags')}
            tags={searchQuery.tagsNOT}
            label={t('core:noneOfTheseTags')}
            handleChange={handleTagFieldChange}
            tagSearchType="tagsNOT"
            tagMode="remove"
          />
        </FormControl>
        <FormControl
          className={classes.formControl}
          disabled={isIndexing !== undefined}
        >
          <TooltipTS title={t('filterByTypTooltip')}>
            <FormHelperText style={{ marginLeft: 0 }}>
              {t('core:fileType')}
            </FormHelperText>
            <Select
              fullWidth
              value={JSON.stringify(fileTypes.current)}
              onChange={handleFileTypeChange}
              size={desktopMode ? 'small' : 'medium'}
              input={<OutlinedInput name="fileTypes" id="file-type" />}
            >
              <MenuItem value={JSON.stringify(AppConfig.SearchTypeGroups.any)}>
                {t('core:anyType')}
              </MenuItem>
              <MenuItem
                value={JSON.stringify(AppConfig.SearchTypeGroups.folders)}
              >
                <TsIconButton size="small">
                  <FolderIcon />
                </TsIconButton>
                {t('core:searchFolders')}
              </MenuItem>
              <MenuItem
                value={JSON.stringify(AppConfig.SearchTypeGroups.files)}
              >
                <TsIconButton size="small">
                  <FileIcon />
                </TsIconButton>
                {t('core:searchFiles')}
              </MenuItem>
              <MenuItem
                value={JSON.stringify(AppConfig.SearchTypeGroups.untagged)}
              >
                <TsIconButton size="small">
                  <UntaggedIcon />
                </TsIconButton>
                {t('core:searchUntaggedEntries')}
              </MenuItem>
              <MenuItem
                value={JSON.stringify(AppConfig.SearchTypeGroups.images)}
                title={AppConfig.SearchTypeGroups.images.toString()}
              >
                <TsIconButton size="small">
                  <PictureIcon />
                </TsIconButton>
                {t('core:searchPictures')}
              </MenuItem>
              <MenuItem
                value={JSON.stringify(AppConfig.SearchTypeGroups.documents)}
                title={AppConfig.SearchTypeGroups.documents.toString()}
              >
                <TsIconButton size="small">
                  <DocumentIcon />
                </TsIconButton>
                {t('core:searchDocuments')}
              </MenuItem>
              <MenuItem
                value={JSON.stringify(AppConfig.SearchTypeGroups.notes)}
                title={AppConfig.SearchTypeGroups.notes.toString()}
              >
                <TsIconButton size="small">
                  <NoteIcon />
                </TsIconButton>
                {t('core:searchNotes')}
              </MenuItem>
              <MenuItem
                value={JSON.stringify(AppConfig.SearchTypeGroups.audio)}
                title={AppConfig.SearchTypeGroups.audio.toString()}
              >
                <TsIconButton size="small">
                  <AudioIcon />
                </TsIconButton>
                {t('core:searchAudio')}
              </MenuItem>
              <MenuItem
                value={JSON.stringify(AppConfig.SearchTypeGroups.video)}
                title={AppConfig.SearchTypeGroups.video.toString()}
              >
                <TsIconButton size="small">
                  <VideoIcon />
                </TsIconButton>
                {t('core:searchVideoFiles')}
              </MenuItem>
              <MenuItem
                value={JSON.stringify(AppConfig.SearchTypeGroups.archives)}
                title={AppConfig.SearchTypeGroups.archives.toString()}
              >
                <TsIconButton size="small">
                  <ArchiveIcon />
                </TsIconButton>
                {t('core:searchArchives')}
              </MenuItem>
              <MenuItem
                value={JSON.stringify(AppConfig.SearchTypeGroups.bookmarks)}
                title={AppConfig.SearchTypeGroups.bookmarks.toString()}
              >
                <TsIconButton size="small">
                  <BookmarkIcon />
                </TsIconButton>
                {t('core:searchBookmarks')}
              </MenuItem>
              <MenuItem
                value={JSON.stringify(AppConfig.SearchTypeGroups.ebooks)}
                title={AppConfig.SearchTypeGroups.ebooks.toString()}
              >
                <TsIconButton size="small">
                  <BookIcon />
                </TsIconButton>
                {t('core:searchEbooks')}
              </MenuItem>
              <MenuItem
                value={JSON.stringify(AppConfig.SearchTypeGroups.emails)}
                title={AppConfig.SearchTypeGroups.emails.toString()}
              >
                <TsIconButton size="small">
                  <EmailIcon />
                </TsIconButton>
                {t('core:searchEmails')}
              </MenuItem>
            </Select>
          </TooltipTS>
        </FormControl>
        <FormControl
          className={classes.formControl}
          disabled={isIndexing !== undefined}
        >
          <TooltipTS title={t('filterBySizeTooltip')}>
            <FormHelperText style={{ marginLeft: 0 }}>
              {t('core:sizeSearchTitle')}
            </FormHelperText>
            <Select
              fullWidth
              value={fileSize.current}
              onChange={handleFileSizeChange}
              size={desktopMode ? 'small' : 'medium'}
              input={<OutlinedInput name="fileSize" id="file-size" />}
              displayEmpty
            >
              <MenuItem value="">{t('core:sizeAny')}</MenuItem>
              <MenuItem value="sizeEmpty">{t('core:sizeEmpty')}</MenuItem>
              <MenuItem value="sizeTiny">
                {t('core:sizeTiny')}
                &nbsp;(&lt;&nbsp;10KB)
              </MenuItem>
              <MenuItem value="sizeVerySmall">
                {t('core:sizeVerySmall')}
                &nbsp;(&lt;&nbsp;100KB)
              </MenuItem>
              <MenuItem value="sizeSmall">
                {t('core:sizeSmall')}
                &nbsp;(&lt;&nbsp;1MB)
              </MenuItem>
              <MenuItem value="sizeMedium">
                {t('core:sizeMedium')}
                &nbsp;(&lt;&nbsp;50MB)
              </MenuItem>
              <MenuItem value="sizeLarge">
                {t('core:sizeLarge')}
                &nbsp;(&lt;&nbsp;1GB)
              </MenuItem>
              <MenuItem value="sizeHuge">
                {t('core:sizeHuge')}
                &nbsp;(&gt;&nbsp;1GB)
              </MenuItem>
            </Select>
          </TooltipTS>
        </FormControl>
        <FormControl
          className={classes.formControl}
          disabled={isIndexing !== undefined}
        >
          <TooltipTS title={t('filterByLastModifiedDateTooltip')}>
            <FormHelperText style={{ marginLeft: 0 }}>
              {t('core:lastModifiedSearchTitle')}
            </FormHelperText>
            <Select
              fullWidth
              value={lastModified.current}
              onChange={handleLastModifiedChange}
              size={desktopMode ? 'small' : 'medium'}
              input={
                <OutlinedInput name="lastModified" id="modification-date" />
              }
              displayEmpty
            >
              <MenuItem value="">{t('core:anyTime')}</MenuItem>
              <MenuItem value="today">{t('core:today')}</MenuItem>
              <MenuItem value="yesterday">{t('core:yesterday')}</MenuItem>
              <MenuItem value="past7Days">{t('core:past7Days')}</MenuItem>
              <MenuItem value="past30Days">{t('core:past30Days')}</MenuItem>
              <MenuItem value="past6Months">{t('core:past6Months')}</MenuItem>
              <MenuItem value="pastYear">{t('core:pastYear')}</MenuItem>
              <MenuItem value="moreThanYear">{t('core:moreThanYear')}</MenuItem>
            </Select>
          </TooltipTS>
        </FormControl>
        <FormControl className={classes.formControl}>
          <TooltipTS title={t('enterTimePeriodTooltip')}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box position="relative" display="inline-flex">
                <div>
                  <FormHelperText style={{ marginLeft: 0, marginTop: 0 }}>
                    {t('core:enterTagTimePeriodFrom')}
                  </FormHelperText>
                  <DatePicker
                    disabled={isIndexing !== undefined}
                    format="yyyy-MM-dd"
                    value={tagTimePeriodFrom && new Date(tagTimePeriodFrom)}
                    onChange={(fromDataTime: Date) => {
                      if (fromDataTime) {
                        setSearchQuery({
                          ...searchQuery,
                          tagTimePeriodFrom: fromDataTime.getTime(),
                          executeSearch: false,
                        });
                      }
                    }}
                  />
                </div>
                <div style={{ marginLeft: 5 }}>
                  <FormHelperText style={{ marginLeft: 0, marginTop: 0 }}>
                    {t('core:enterTagTimePeriodTo')}
                  </FormHelperText>
                  <DatePicker
                    disabled={isIndexing !== undefined}
                    format="yyyy-MM-dd"
                    value={tagTimePeriodTo && new Date(tagTimePeriodTo)}
                    onChange={(toDataTime: Date) => {
                      if (toDataTime) {
                        setSearchQuery({
                          ...searchQuery,
                          tagTimePeriodTo: toDataTime.getTime(),
                          executeSearch: false,
                        });
                      }
                    }}
                  />
                </div>
              </Box>
            </LocalizationProvider>
          </TooltipTS>
          {/* <TsTextField
                id="tagPlace"
                label={t('GPS coordinates or plus code')}
                value={tagPlace}
                disabled={indexing || !Pro}
                onChange={handlePlaceChange}
                onKeyDown={startSearch}
                helperText={tagPlaceHelper}
                error={tagPlaceHelper.length < 1}
                InputProps={{
                  endAdornment: (
                    <InputAdornment
                      position="end"
                      title="GPS: 49.23276,12.43123 PlusCode: 8FRG8Q87+6X"
                    >
                      <IconButton onClick={openPlace}>
                        <PlaceIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              /> */}
        </FormControl>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: 5,
        }}
      >
        <TsButton
          data-tid="helpSearchButtonTID"
          onClick={() =>
            openURLExternally(Links.documentationLinks.search, true)
          }
        >
          {t('help')}
        </TsButton>
        <div>
          <TsButton onClick={clearSearch} id="resetSearchButton">
            {t('resetBtn')}
          </TsButton>
          <TsButton
            style={{ marginLeft: AppConfig.defaultSpaceBetweenButtons }}
            variant="contained"
            disabled={isIndexing !== undefined}
            id="searchButtonAdvTID"
            onClick={executeSearch}
          >
            {isIndexing !== undefined
              ? 'Search disabled while indexing'
              : t('searchTitle')}
          </TsButton>
        </div>
      </div>
      <SaveSearchDialog
        open={saveSearchDialogOpened !== undefined}
        onClose={(searchQuery: TS.SearchQuery) => {
          setSaveSearchDialogOpened(undefined);
          if (searchQuery) {
            setSearchQuery({
              ...searchQuery,
              showUnixHiddenEntries,
            });
          }
        }}
        onClearSearch={() => clearSearch()}
        searchQuery={saveSearchDialogOpened}
      />
    </SidePanel>
  );
}

export default SearchPopover;
