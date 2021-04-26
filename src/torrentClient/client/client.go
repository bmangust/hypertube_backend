package client

import (
	"bytes"
	"fmt"
	"net"
	"time"

	"torrentClient/bitfield"
	"torrentClient/handshake"
	"torrentClient/message"
	"torrentClient/peers"

	"github.com/sirupsen/logrus"
)


func completeHandshake(conn net.Conn, infohash, peerID [20]byte) (*handshake.Handshake, error) {
	conn.SetDeadline(time.Now().Add(3 * time.Second))
	defer conn.SetDeadline(time.Time{}) // Disable the deadline

	req := handshake.New(infohash, peerID)
	_, err := conn.Write(req.Serialize())
	if err != nil {
		return nil, fmt.Errorf("request write error: %v", err)
	} else {
		logrus.Infof("Wrote handshake msg (%v bytes)", len(req.Serialize()))
	}

	res, err := handshake.Read(conn)
	if err != nil {
		return nil, fmt.Errorf("read error: %v", err)
	}
	if !bytes.Equal(res.InfoHash[:], infohash[:]) {
		return nil, fmt.Errorf("expected infohash %x but got %x", res.InfoHash, infohash)
	}
	return res, nil
}

func recvBitfield(conn net.Conn) (bitfield.Bitfield, error) {
	conn.SetDeadline(time.Now().Add(5 * time.Second))
	defer conn.SetDeadline(time.Time{}) // Disable the deadline

	msg, err := message.Read(conn)
	if err != nil {
		return nil, err
	}
	if msg == nil {
		err := fmt.Errorf("expected bitfield but got %s", msg)
		return nil, err
	}
	if msg.ID != message.MsgBitfield {
		err := fmt.Errorf("expected bitfield but got ID %d", msg.ID)
		return nil, err
	}

	return msg.Payload, nil
}

// New connects with a peer, completes a handshake, and receives a handshake
// returns an err if any of those fail.
func New(peer peers.Peer, peerID, infoHash [20]byte) (*Client, error) {
	conn, err := net.DialTimeout("tcp", peer.GetAddr(), 10 * time.Second)
	if err != nil {
		return nil, fmt.Errorf("dial error: %v; was connecting to %v", err, peer.GetAddr())
	} else {
		logrus.Infof("Connected to peer on %v", peer.GetAddr())
	}

	_, err = completeHandshake(conn, infoHash, peerID)
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("handshake error: %v", err)
	}

	bf, err := recvBitfield(conn)
	if err != nil {
		conn.Close()
		return nil, err
	}

	return &Client{
		Conn:     conn,
		Choked:   true,
		Bitfield: bf,
		peer:     peer,
		infoHash: infoHash,
		peerID:   peerID,
	}, nil
}

// Read reads and consumes a message from the connection
func (c *Client) Read() (*message.Message, error) {
	msg, err := message.Read(c.Conn)
	return msg, err
}

// SendRequest sends a Request message to the peer
func (c *Client) SendRequest(index, begin, length int) error {
	req := message.FormatRequest(index, begin, length)
	_, err := c.Conn.Write(req.Serialize())
	return err
}

// SendInterested sends an Interested message to the peer
func (c *Client) SendInterested() error {
	msg := message.Message{ID: message.MsgInterested}
	_, err := c.Conn.Write(msg.Serialize())
	if err != nil {
		logrus.Errorf("Error sending interested msg: %v", err)
	}
	return err
}

// SendNotInterested sends a NotInterested message to the peer
func (c *Client) SendNotInterested() error {
	msg := message.Message{ID: message.MsgNotInterested}
	_, err := c.Conn.Write(msg.Serialize())
	if err != nil {
		logrus.Errorf("Error sending not interested msg: %v", err)
	}
	return err
}

// SendUnchoke sends an Unchoke message to the peer
func (c *Client) SendUnchoke() error {
	msg := message.Message{ID: message.MsgUnchoke}
	_, err := c.Conn.Write(msg.Serialize())
	if err != nil {
		logrus.Errorf("Error sending unchoke msg: %v", err)
	}
	return err
}

// SendHave sends a Have message to the peer
func (c *Client) SendHave(index int) error {
	msg := message.FormatHave(index)
	_, err := c.Conn.Write(msg.Serialize())
	if err != nil {
		logrus.Errorf("Error sending have msg: %v", err)
	}
	return err
}
