import React from 'react';
import MaterialItem from './MaterialItem';

const MaterialList = ({
  items,
  activeDropdown,
  onToggleDropdown,
  onHandleDropdownAction,
  getItemIcon,
  DropdownMenuComponent,
  dropdownRefs,
  curriculumId,
  allSectionsData
}) => {
  return (
    <>
      {items.map((item, index) => (
        <MaterialItem
          key={index}
          item={{
            ...item,
            curriculumId: curriculumId,
            allSectionsData: allSectionsData
          }}
          index={index}
          activeDropdown={activeDropdown}
          onToggleDropdown={onToggleDropdown}
          onHandleDropdownAction={onHandleDropdownAction}
          getItemIcon={getItemIcon}
          DropdownMenuComponent={DropdownMenuComponent}
          dropdownRefs={dropdownRefs}
        />
      ))}
    </>
  );
};

export default MaterialList;