import { type ReactNode } from 'react';

import ResourceListCard from './Cards/ResourceListCard';

const styles = {
  flex: { display: 'flex' },
  flexColumn: { display: 'flex', flexDirection: 'column' },
  leftCol: { flex: 1, marginRight: '0.5em' },
  rightCol: { flex: 1, marginLeft: '0.5em' },
  singleCol: { marginTop: '1em', marginBottom: '1em' },
};

const Spacer = () => <span style={{ width: '1em' }} />;


const Dashboard = (): ReactNode => {



  return (
    <div style={styles.flex}>
        <div style={styles.leftCol}>
            <div style={styles.flex}>
                <ResourceListCard resource={'WebMapService'} withList={false}/>
                <Spacer />
                <ResourceListCard resource={'Layer'} withList={false}/>
                <Spacer />
                <ResourceListCard resource={'WebFeatureService'} withList={false}/>
                <Spacer />
                <ResourceListCard resource={'FeatureType'} withList={false}/>
                {/* <NbNewOrders value={nbNewOrders} /> */}
            </div>
            <div style={styles.singleCol}>
                {/* <OrderChart orders={recentOrders} /> */}
            </div>
            <div style={styles.singleCol}>
                {/* <PendingOrders orders={pendingOrders} /> */}
            </div>
        </div>
        <div style={styles.rightCol}>
            <div style={styles.flex}>
                <ResourceListCard resource={'Organization'} />
                <Spacer />
                <ResourceListCard resource={'User'} />
            </div>
        </div>
    </div>


    // <Card>
    //         <CardHeader title={translate('pos.dashboard.month_history')} />
    //         <CardContent>
    //             <div style={{ width: '100%', height: 300 }}>
    //                 <ResponsiveContainer>
                        
    //                 </ResponsiveContainer>
    //             </div>
    //         </CardContent>
    //     </Card>
  )
}

export default Dashboard
