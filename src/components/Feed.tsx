import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Avatar, Divider } from '@mui/material';
import { supabase } from '../supabaseClient';

interface FeedItem {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

const Feed: React.FC = () => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const fetchFeedItems = async () => {
      const { data, error } = await supabase.from('feed').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching feed items:', error.message);
      } else {
        setFeedItems(data || []);
      }
    };

    fetchFeedItems();
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Feed
      </Typography>
      <List>
        {feedItems.map((item) => (
          <React.Fragment key={item.id}>
            <ListItem alignItems="flex-start">
              <Avatar alt="User Avatar" src={`https://api.adorable.io/avatars/40/${item.user_id}.png`} />
              <ListItemText
                primary={item.content}
                secondary={new Date(item.created_at).toLocaleString()}
              />
            </ListItem>
            <Divider variant="inset" component="li" />
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default Feed;
