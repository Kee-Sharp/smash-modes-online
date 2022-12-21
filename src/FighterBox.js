import React from 'react';

export const FighterBox = ({ available, images, fighterClick, setPick }) => {
  //107x50 original 200x94
  return (
    <div className="fighter-box" onMouseOut={() => setPick('none')}>
      {available.map((fighter, i) => {
        const { name, file } = fighter;
        return (
          <img
            src={images[name].horizontal ?? null}
            key={file}
            alt={name}
            height={50}
            style={{
              objectFit: 'cover',
              objectPosition: '-90px 0',
              width: 107,
              border: '1px solid black',
            }}
            onClick={() => fighterClick(name)}
            onMouseOver={() => setPick(name)}
          />
        );
      })}
    </div>
  );
};
