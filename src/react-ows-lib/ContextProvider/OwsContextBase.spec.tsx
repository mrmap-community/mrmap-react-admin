import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OwsContextBase, useOwsContextBase } from '../../react-ows-lib/ContextProvider/OwsContextBase';
import {karteRpFeatures as testdata} from '../../ows-lib/OwsContext/tests/data'



import {ReactNode} from 'react'
import { Position } from '../../ows-lib/OwsContext/enums';



const getKarteRpFeatures = () => {
  return JSON.parse(JSON.stringify(testdata))
}

export const MapViewerBaseWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <OwsContextBase initialFeatures={getKarteRpFeatures()}>
      {children}
    </OwsContextBase>
  )
}


const TestingComponent = () => {
    const { features, moveFeature } = useOwsContextBase();
    
    return (
      <>
        {features.map(feature => 
            <div 
                key={feature.properties.folder}
                data-testid='row'
            >
                {feature.properties.title}
            </div>
        )}
      
        <button data-testid={'move-left'} onClick={() => moveFeature(features[10], features[8], Position.left)}>move left</button>
        <button data-testid={'move-firstChild'} onClick={() => moveFeature(features[10], features[0], Position.firstChild)}>move first child</button>

      </>
    );
  };
  

describe('OwsContextBase', () => {
  it('OwsContextBase test moveFeature sequences works without any errors', () => {
   render(<TestingComponent />, {wrapper: MapViewerBaseWrapper});

   fireEvent.click(screen.getByTestId('move-left'));
   const firstMoveResult = screen.getAllByTestId('row')
   expect(within(firstMoveResult[7]).queryByText('Wald 0')).toBeInTheDocument();
   expect(within(firstMoveResult[8]).queryByText('Wald 3')).toBeInTheDocument();
   expect(within(firstMoveResult[9]).queryByText('Wald 1')).toBeInTheDocument();


   fireEvent.click(screen.getByTestId('move-firstChild'));
   const secondMoveResult = screen.getAllByTestId('row')
   expect(within(secondMoveResult[1]).queryByText('Wald 2')).toBeInTheDocument();
   expect(within(secondMoveResult[2]).queryByText('Landesfläche')).toBeInTheDocument();

  });
 
});