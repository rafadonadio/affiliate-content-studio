import React, { useState } from 'react';
import FilerobotImageEditor, { TABS, TOOLS } from 'react-filerobot-image-editor';

interface ImageEditorProps {
  imageSrc: string;
  onSave: (editedImageBase64: string) => void;
  onCancel: () => void;
}

export default function ImageEditor({ imageSrc, onSave, onCancel }: ImageEditorProps) {
  const [isImgEditorShown, setIsImgEditorShown] = useState(true);

  const closeImgEditor = () => {
    setIsImgEditorShown(false);
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="w-11/12 h-5/6 bg-white rounded-lg overflow-hidden">
        {isImgEditorShown && (
          <FilerobotImageEditor
            source={imageSrc}
            onSave={(editedImageObject, designState) => {
              console.log('saved', editedImageObject, designState);
              onSave(editedImageObject.imageBase64 || '');
              closeImgEditor();
            }}
            onClose={closeImgEditor}
            annotationsCommon={{
              fill: '#ff0000',
            }}
            Text={{ text: 'Add Text' }}
            Rotate={{ angle: 90, componentType: 'slider' }}
            Crop={{
              presetsItems: [
                { titleKey: 'classicTv', descriptionKey: '4:3', ratio: 4 / 3 },
                { titleKey: 'cinemascope', descriptionKey: '21:9', ratio: 21 / 9 },
              ],
              presetsFolders: [
                {
                  titleKey: 'socialMedia',
                  groups: [
                    {
                      titleKey: 'instagram',
                      items: [
                        { titleKey: 'profile', width: 320, height: 320, descriptionKey: '1:1' },
                        { titleKey: 'profileSquare', width: 1080, height: 1080, descriptionKey: '1:1' },
                        { titleKey: 'profilePortrait', width: 1080, height: 1350, descriptionKey: '4:5' },
                      ],
                    },
                  ],
                },
              ],
            }}
            tabsIds={[TABS.ADJUST, TABS.ANNOTATE, TABS.WATERMARK, TABS.FILTERS, TABS.FINETUNE]}
            defaultTabId={TABS.ADJUST}
            defaultToolId={TOOLS.CROP}
          />
        )}
      </div>
    </div>
  );
}
