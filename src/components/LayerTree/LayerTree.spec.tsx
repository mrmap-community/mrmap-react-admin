import {ReactNode} from 'react'

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import {karteRpFeatures as testdata} from '../../ows-lib/OwsContext/tests/data'
import { OwsContextBase } from '../../react-ows-lib/ContextProvider/OwsContextBase';
import LayerTree from './LayerTree';


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
    render(<LayerTree />, {wrapper: MapViewerBaseWrapper})
    
    expect(screen.getByText('Karte RP')).toBeInTheDocument();
  });

  it('LayerTree renders with initial expanded values', () => {
    render(<LayerTree initialExpanded={['/0', '/0/1']}/>, {wrapper: MapViewerBaseWrapper})
    
    expect(screen.getByText('Karte RP')).toBeInTheDocument();
    expect(screen.getByText('Wald')).toBeInTheDocument();
    expect(screen.getByText('Wald 0')).toBeInTheDocument();
  });

  it('LayerTree is expandable', () => {
    render(<LayerTree />, {wrapper: MapViewerBaseWrapper})

    const expandIcon = screen.getByTestId('KeyboardArrowRightIcon')
    fireEvent.click(expandIcon)
    expect(screen.getByText('Wald')).toBeInTheDocument();
  });
});