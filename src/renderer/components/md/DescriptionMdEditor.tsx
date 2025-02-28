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
import React, { useRef } from 'react';
import { Milkdown, useEditor } from '@milkdown/react';
import { EditorStatus } from '@milkdown/kit/core';
import { useOpenedEntryContext } from '-/hooks/useOpenedEntryContext';
import { createCrepeEditor } from '-/components/md/utils';
import { CrepeRef, useCrepeHandler } from '-/components/md/useCrepeHandler';
import { Crepe } from '@milkdown/crepe';

interface CrepeMdEditorProps {
  defaultEditMode: boolean;
  defaultContent: string;
  currentFolder?: string;
  placeholder?: string;
  onChange?: (markdown: string, prevMarkdown: string) => void;
  onFocus?: () => void;
}

const DescriptionMdEditor = React.forwardRef<CrepeRef, CrepeMdEditorProps>(
  (props, ref) => {
    const {
      defaultEditMode,
      defaultContent,
      currentFolder,
      onChange,
      onFocus,
      placeholder,
    } = props;
    const { openLink } = useOpenedEntryContext();
    const crepeInstanceRef = useRef<Crepe>(undefined);

    const { get, loading } = useEditor(
      (root) => {
        /*if (crepeInstanceRef.current) {
          return crepeInstanceRef.current;
        }*/
        const crepe = createCrepeEditor(
          root,
          defaultContent,
          defaultEditMode,
          placeholder,
          currentFolder,
          openLink,
          onChange,
          onFocus,
        );

        crepe.editor.onStatusChange((status: EditorStatus) => {
          if (status === EditorStatus.Created) {
            console.log(status);
            /* if (crepeInstanceRef.current) {
              console.log('Destroyed...');
              crepeInstanceRef.current.destroy();
              crepeInstanceRef.current = null;
            }*/
            crepeInstanceRef.current = crepe;
          }
        });

        return crepe;
      },
      [currentFolder, defaultEditMode, defaultContent],
    );

    useCrepeHandler(ref, () => crepeInstanceRef.current, get, loading);

    return <Milkdown />;
  },
);

export default DescriptionMdEditor;
