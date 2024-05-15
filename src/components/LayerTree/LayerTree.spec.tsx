import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
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

  it('Wald 0 can be dragged as left sibling of Wald', async () => {
  
    const {baseElement} = render(<LayerTree initialExpanded={['/0', '/0/1']}/>, {wrapper: MapViewerBaseWrapper})
    const karteRp = screen.getByText('Karte RP');
    const wald0 = screen.getByText('Wald 0');

    const wald0Rect = wald0.getBoundingClientRect()
    const karteRpRect = karteRp.getBoundingClientRect()
    const itemOffset = { 
      top: wald0Rect.top + window.scrollY, 
      left: wald0Rect.left + window.scrollX
    };

    const targetOffset = { 
      top: karteRpRect.top + window.scrollY, 
      left: karteRpRect.left + window.scrollX, 
      bubbles: true,
      cancelable: true,
      button: 0
    };

    const startCords = { 
      clientX: itemOffset.left, 
      clientY: itemOffset.top,
      bubbles: true,
      cancelable: true,
      button: 0
    };
    const endCords = { 
      clientX: targetOffset.left, 
      clientY: targetOffset.top,
      bubbles: true,
      cancelable: true,
      button: 0
    };



    fireEvent.mouseDown(wald0, startCords);
    fireEvent.dragStart(wald0, startCords);
    fireEvent.drag(wald0, endCords);
    fireEvent.dragOver(karteRp,endCords);
    
    await waitFor(()=> expect(screen.getByText('Wald 0')).toBeInTheDocument());

    fireEvent.drop(wald0, endCords);
    //fireEvent.mouseUp(wald0, endCords);

    // screen.debug(undefined, 20000)

    //expect(within(karteRp).getByText('Wald 0')).toBeInTheDocument();
    // expect(within(wald).getByText('Wald 0')).toBeNotInTheDocument();
  });
});