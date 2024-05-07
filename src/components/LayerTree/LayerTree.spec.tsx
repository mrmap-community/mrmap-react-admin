import { render, screen,  } from '@testing-library/react';
import { describe, it } from 'vitest';

import LayerTree from './LayerTree';
import { MapViewerBase } from '../MapViewer/MapViewerContext';
import {karteRpFeatures as testdata} from '../../OwsContext/tests/data'

import {expect} from '@testing-library/jest-dom'

import {ReactNode} from 'react'

const getKarteRpFeatures = () => {
  return JSON.parse(JSON.stringify(testdata))
}

const MapViewerBaseWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <MapViewerBase initialFeatures={getKarteRpFeatures()}>
      {children}
    </MapViewerBase>
  )
}


describe('Dragging test', () => {
  it('Drag Node works as expected', () => {

    render(<LayerTree />, {wrapper: MapViewerBaseWrapper});
    
    expect(screen.getByLabelText('Karte RP')).toBeInTheDocument();

  });
});