import { render, screen, fireEvent, within, act } from '@testing-library/react';
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

  it.todo('Wald 0 can be moved as left sibling of Wald', () => {
    render(<LayerTree initialExpanded={['/0', '/0/1']}/>, {wrapper: MapViewerBaseWrapper})
    const karteRp = screen.getByText('Karte RP');
    const wald0 = screen.getByText('Wald 0');
    const wald = screen.getByText("Wald");

    act(()=>{
      fireEvent.dragStart(wald0);
      fireEvent.dragEnter(wald);
      fireEvent.dragOver(wald);
      fireEvent.drop(wald);
    })

    //screen.debug(undefined, 20000)
    expect(within(karteRp).getByText('Wald 0')).toBeInTheDocument();
    expect(within(wald).getByText('Wald 0')).toBeNotInTheDocument();
  });
});