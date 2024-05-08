import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import LayerTree from './LayerTree';
import { OwsContextBase } from '../../react-ows-lib/ContextProvider/OwsContextBase';
import {karteRpFeatures as testdata} from '../../ows-lib/OwsContext/tests/data'



import {ReactNode} from 'react'

const getKarteRpFeatures = () => {
  return JSON.parse(JSON.stringify(testdata))
}

const MapViewerBaseWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <OwsContextBase initialFeatures={getKarteRpFeatures()}>
      {children}
    </OwsContextBase>
  )
}

describe('LayerTree', () => {
  it('LayerTree renders with initial data', () => {

    render(<LayerTree />, {wrapper: MapViewerBaseWrapper});
    
    expect(screen.getByText('Karte RP')).toBeInTheDocument();

  });
});