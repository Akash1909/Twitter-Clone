import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Form, Button, Card, ListGroup, Col } from 'react-bootstrap'
import { create } from 'ipfs-http-client'


const apikey = "51ec87282bcd0c2943d4d1330c639828"
const projectid ="2KlvQ41U0rvc2sVV6thHKvt6cOe"

const auth = 'Basic '+ `MktsdlE0MVUwcnZjMnNWVjZ0aEhLdnQ2Y09lOjUxZWM4NzI4MmJjZDBjMjk0M2Q0ZDEzMzBjNjM5ODI4`
const client = create({
    host:"ipfs.infura.io",
    port:5001,
    protocol:'https',
    headers:{
        authorization:auth
    }
    
})


const Profile = ({ contract }) => {

    const auth = 'Basic '+ `MktsdlE0MVUwcnZjMnNWVjZ0aEhLdnQ2Y09lOjUxZWM4NzI4MmJjZDBjMjk0M2Q0ZDEzMzBjNjM5ODI4`
const client = create({
    host:"ipfs.infura.io",
    port:5001,
    protocol:'https',
    headers:{
        authorization:auth
    }
    
})
    const [profile, setProfile] = useState('')
    const [nfts, setNfts] = useState('')
    const [avatar, setAvatar] = useState(null)
    const [username, setUsername] = useState('')
    const [loading, setLoading] = useState(true)
    const loadMyNFTs = async () => {
        // Get users nft ids
        const results = await contract.getMyNfts();
        // Fetch metadata of each nft and add that to nft object.
        let nfts = await Promise.all(results.map(async i => {
            // get uri url of nft
            const uri = await contract.tokenURI(i)
            // fetch nft metadata
            const response = await fetch(uri)
            const metadata = await response.json()
            return ({
                id: i,
                username: metadata.username,
                avatar: metadata.avatar
            })
        }))
        setNfts(nfts)
        getProfile(nfts)
    }
    const getProfile = async (nfts) => {
        const address = await contract.signer.getAddress()
        const id = await contract.profiles(address)
        const profile = nfts.find((i) => i.id.toString() === id.toString())
        setProfile(profile)
        setLoading(false)
    }
    const uploadToIPFS = async (event) => {
        
        event.preventDefault()
        const file = event.target.files[0]
        if (typeof file !== 'undefined') {
            console.log("uploading to ipfs")
            try {
                const result = await client.add(file)
                setAvatar(`https://ipfs.io/ipfs/${result.path}`)
                console.log(result)
            } catch (error) {
                console.log("ipfs image upload error: ", error)
            }
        }
    } 
    const mintProfile = async (event) => {
        if (!avatar || !username) return
        try {
            console.log("minting")
            const result = await client.add(JSON.stringify({ avatar, username }))
            setLoading(true)
            await (await contract.mint(`https://ipfs.io/ipfs/${result.path}`)).wait()
            loadMyNFTs()
            window.alert("Profile has been successfull Created")
        } catch (error) {
            window.alert("ipfs uri upload error: ", error)
        }
    }
    const switchProfile = async (nft) => {
       // setLoading(true)
        await (await contract.setProfile(nft.id)).wait()
        getProfile(nfts)
    }
    useEffect(() => {
        if (nfts) {
            loadMyNFTs()
        }
    })
    
    
    return (
        <div className="mt-4 text-center">
            {profile ? (<div className="mb-3"><h3 className="mb-3">{profile.username}</h3>
                <img className="mb-3" style={{ width: '400px' }} src={profile.avatar} /></div>)
                :
                <h4 className="mb-4">No profile, please create one...</h4>}

            <div className="row">
                <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
                    <div className="content mx-auto">
                        <Row className="g-4">
                            <Form.Control
                                type="file"
                                required
                                name="file"
                                onChange={uploadToIPFS}
                            />
                            <Form.Control onChange={(e) => setUsername(e.target.value)} size="lg" required type="text" placeholder="Username" />
                            <div className="d-grid px-0">
                                <Button onClick={mintProfile} variant="primary" size="lg">
                                    Set Profile
                                </Button>
                            </div>
                        </Row>
                    </div>
                </main>
            </div>
             <div className="px-5 container">
                <Row xs={1} md={2} lg={4} className="g-4 py-5">
                    { [nfts].map((nft,idx ) => {
                        if (nft.id === profile.id) return
                        return (
                            <Col key={idx} className="overflow-hidden">
                                <Card>
                                    <Card.Img variant="top" src={nft.avatar} />
                                    <Card.Body color="secondary">
                                        <Card.Title>{nft.username}</Card.Title>
                                    </Card.Body>
                                    <Card.Footer>
                                        <div className='d-grid'>
                                            <Button onClick={() => switchProfile(nft)} variant="primary" size="lg">
                                                Set as Profile
                                            </Button>
                                        </div>
                                    </Card.Footer>
                                </Card>
                            </Col>
                        )
                    })} 
                </Row>
            </div>
        </div>
    );
}

export default Profile;