import { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { karteRpFeatures as testdata } from '../../ows-lib/OwsContext/tests/data';
import { OWSResource } from '../../ows-lib/OwsContext/types';
import { treeify } from '../../ows-lib/OwsContext/utils';
import { OwsContextBase } from '../../react-ows-lib/ContextProvider/OwsContextBase';
import NodeCheckbox from './NodeCheckbox';


const getKarteRpFeatures = () => {
  return JSON.parse(JSON.stringify(testdata))
}

const karteRp: OWSResource[] = getKarteRpFeatures()

// Land 3 active
karteRp[5].properties.active = true
// Wald, Wald 0, Wald 1, Wald 2, Wald 3, Wald 4 active
karteRp[6].properties.active = true
karteRp[7].properties.active = true
karteRp[8].properties.active = true
karteRp[9].properties.active = true
karteRp[10].properties.active = true
karteRp[11].properties.active = true


const MapViewerBaseWrapper = ({ children }: { children: ReactNode }) => {
   
  return (
    <OwsContextBase initialFeatures={karteRp}>
      {children}
    </OwsContextBase>
  )
}




describe('LayerTree', () => {
  
  it('NodeCheckbox with inactive node', () => {
    const tree = treeify(karteRp)
    const wald = tree[0].children[2].children[0]

    
    render(<NodeCheckbox node={wald}/>, {wrapper: MapViewerBaseWrapper});

    expect(screen.getByText('Karte RP')).toBeInTheDocument();


  });
});